#!/usr/bin/env python3
"""Write the current menu into backstreet-cafe.html and assets/menu-data.json.

The page fetches the menu from Supabase at load time, which means the menu does
not exist in the HTML a crawler receives, and disappears entirely whenever the
database is asleep. This script renders the same markup menu-browser.js would
draw, straight into the page, and refreshes the bundled offline copy at the same
time. Supabase stays the place the cafe edits the menu; this just makes the
result survive without it.

Run it after any menu change, then commit:

    python3 build-menu.py

Standard library only. There is no node, npm or build step in this project.
"""

import json
import os
import re
import subprocess
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(ROOT, 'backstreet-cafe.html')
OFFLINE = os.path.join(ROOT, 'assets', 'menu-data.json')
CONFIG = os.path.join(ROOT, 'assets', 'supabase-config.js')

MENU_IMG_BASE = 'https://backstreet-cafe-menu.netlify.app'
# Matches what encodeURI() leaves alone, so the generated src attributes are
# byte-identical to the ones the script produces in the browser.
ENCODE_URI_SAFE = ("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
                   "0123456789;,/?:@&=+$-_.!~*'()#%")


def read_config():
    """The url and publishable key, taken from the file the site itself uses."""
    text = open(CONFIG, encoding='utf-8').read()
    url = re.search(r"url:\s*'([^']+)'", text).group(1)
    key = re.search(r"publishableKey:\s*'([^']+)'", text).group(1)
    return url, key


def get(url, key, path):
    """Read a table through PostgREST.

    Uses curl rather than urllib on purpose: the python.org builds for macOS
    ship without root certificates, so urllib fails on any https call with
    CERTIFICATE_VERIFY_FAILED until someone runs Install Certificates.command.
    curl is present on macOS and Linux and uses the system trust store, so the
    script works on a machine nobody has prepared.
    """
    result = subprocess.run(
        ['curl', '-sS', '--fail', '--max-time', '60',
         '%s/rest/v1/%s' % (url, path),
         '-H', 'apikey: %s' % key,
         '-H', 'Authorization: Bearer %s' % key],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise SystemExit('could not read %s from Supabase: %s'
                         % (path.split('?')[0], result.stderr.strip()))
    return json.loads(result.stdout)


def esc(value):
    return (str('' if value is None else value)
            .replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def price(value):
    return '$%.2f' % float(value or 0)


def img_src(item):
    url = item.get('image_url') or ''
    if not url:
        return ''
    if not url.startswith('http'):
        url = MENU_IMG_BASE + url
    return urllib.parse.quote(url, safe=ENCODE_URI_SAFE)


def tags_html(tags, labels):
    if not tags:
        return ''
    spans = ''.join('<span class="menu-item-tag">%s</span>' % esc(labels.get(t, t))
                    for t in tags)
    return '<div class="menu-item-tags">%s</div>' % spans


def item_row(item, labels):
    img = img_src(item)
    thumb = ('<div class="menu-item-thumb"><img src="%s" alt="" loading="lazy"></div>'
             % esc(img)) if img else ''
    return (
        '        <article class="menu-item-row" data-item-id="%s" tabindex="0" role="button" aria-label="View %s">\n'
        '          %s\n'
        '          <div class="menu-item-body">\n'
        '            <div class="menu-item-head">\n'
        '              <h3 class="menu-item-name">%s</h3>\n'
        '              <span class="menu-item-price">%s</span>\n'
        '            </div>\n'
        '            <p class="menu-item-desc">%s</p>\n'
        '            %s\n'
        '          </div>\n'
        '        </article>\n'
    ) % (esc(item['id']), esc(item['name']), thumb, esc(item['name']),
         price(item['price']), esc(item.get('description') or ''),
         tags_html(item.get('tags'), labels))


def extra_item(item):
    return ('        <li class="menu-extra-item">\n'
            '          <span class="menu-extra-name">%s</span>\n'
            '          <span class="menu-extra-price">%s</span>\n'
            '        </li>\n') % (esc(item['name']), price(item['price']))


def section(category, items, labels):
    if category['layout'] == 'list':
        body = ('      <ul class="menu-extra-list">\n%s      </ul>\n'
                % ''.join(extra_item(i) for i in items))
    else:
        body = ('      <div class="menu-item-list">\n%s      </div>\n'
                % ''.join(item_row(i, labels) for i in items))
    return ('    <section class="menu-category-block">\n'
            '      <div class="menu-category-head">\n'
            '        <h3 class="menu-category-title">%s</h3>\n'
            '        <div class="menu-category-line"></div>\n'
            '      </div>\n'
            '%s'
            '    </section>\n') % (esc(category['label']), body)


def featured_card(item):
    img = img_src(item)
    image = ('<img class="menu-featured-img" src="%s" alt="%s" loading="lazy">'
             % (esc(img), esc(item['name']))) if img else ''
    return (
        '      <article class="menu-featured-card" data-item-id="%s" tabindex="0" role="button" aria-label="View %s">\n'
        '        %s\n'
        '        <div class="menu-featured-overlay"></div>\n'
        '        <div class="menu-featured-content">\n'
        '          <span class="menu-featured-badge">%s</span>\n'
        '          <h3 class="menu-featured-name">%s</h3>\n'
        '          <p class="menu-featured-desc">%s</p>\n'
        '          <span class="menu-featured-price">%s</span>\n'
        '        </div>\n'
        '      </article>\n'
    ) % (esc(item['id']), esc(item['name']), image, esc(item['badge']),
         esc(item['name']), esc(item.get('description') or ''), price(item['price']))


def replace_between(text, marker, body):
    """Swap what sits between <!-- marker:start --> and <!-- marker:end -->."""
    start = '<!-- %s:start -->' % marker
    end = '<!-- %s:end -->' % marker
    pattern = re.compile(re.escape(start) + '.*?' + re.escape(end), re.S)
    if not pattern.search(text):
        raise SystemExit('marker %s not found in backstreet-cafe.html' % marker)
    return pattern.sub(lambda _: '%s\n%s      %s' % (start, body, end), text, count=1)


def refresh_offline(items):
    """Bring assets/menu-data.json back in line with the database.

    Applied field by field onto the existing file rather than regenerated: the
    offline copy carries its own short ids, which the badge lookup in
    menu-browser.js depends on, and relative image paths. Supabase uses UUIDs
    and absolute URLs, and copying those across would break both.
    """
    original = open(OFFLINE, 'rb').read()
    rows = json.loads(original)
    live = {i['name']: i for i in items}
    changed = 0
    for row in rows:
        current = live.get(row['name'])
        if not current:
            continue
        for offline_key, live_key in (('price', 'price'),
                                      ('description', 'description'),
                                      ('tags', 'tags')):
            value = current.get(live_key)
            if live_key == 'price':
                value = float(value)
            elif live_key == 'description':
                value = value or ''
            else:
                value = value or []
            if row.get(offline_key) != value:
                row[offline_key] = value
                changed += 1
    updated = json.dumps(rows, indent=2, ensure_ascii=False).encode()
    if updated != original:
        open(OFFLINE, 'wb').write(updated)
    return changed


def main():
    url, key = read_config()
    items = get(url, key,
                'menu_items?select=id,name,description,price,category,image_url,tags,badge'
                '&is_available=eq.true&order=category.asc,sort_order.asc,name.asc')
    categories = get(url, key,
                     'menu_categories?select=key,label,tab,layout&is_visible=eq.true'
                     '&order=tab.asc,sort_order.asc,label.asc')
    labels = {t['code']: t['label']
              for t in get(url, key, 'dietary_tags?select=code,label&order=sort_order.asc,code.asc')}

    by_tab = {}
    for category in categories:
        by_tab.setdefault(category['tab'], []).append(category)

    breakfast_keys = {c['key'] for c in by_tab.get('breakfast', [])}
    featured = [i for i in items if i.get('badge') and i['category'] in breakfast_keys]
    featured_ids = {i['id'] for i in featured}

    def sections_for(tab, skip=frozenset()):
        out = []
        for category in by_tab.get(tab, []):
            rows = [i for i in items
                    if i['category'] == category['key'] and i['id'] not in skip]
            if rows:
                out.append(section(category, rows, labels))
        return ''.join(out)

    featured_html = ('    <div class="menu-featured-header">\n'
                     '      <h3 class="menu-featured-title">Signatures &amp; Favourites</h3>\n'
                     '    </div>\n'
                     '    <div class="menu-featured-grid">\n%s    </div>\n'
                     % ''.join(featured_card(i) for i in featured))

    catalog_html = (
        sections_for('breakfast', featured_ids)
        + '    <!-- Lunch and drinks sit behind their tabs in the live page, so they are\n'
          '         hidden here to keep the first paint identical to what the script draws.\n'
          '         They stay in the HTML because a crawler reading the source should get\n'
          '         the whole menu, not just breakfast. -->\n'
          '    <div hidden>\n'
        + sections_for('lunch') + sections_for('drinks')
        + '    </div>\n')

    page = open(PAGE, encoding='utf-8').read()
    page = replace_between(page, 'menu:featured', featured_html)
    page = replace_between(page, 'menu:catalog', catalog_html)
    open(PAGE, 'w', encoding='utf-8').write(page)

    rendered = sum(1 for i in items
                   if any(c['key'] == i['category'] for c in categories))
    offline_changes = refresh_offline(items)
    print('backstreet-cafe.html  %d items across %d categories (%d featured)'
          % (rendered, len(categories), len(featured)))
    print('assets/menu-data.json %d field(s) brought back in line'
          % offline_changes)


if __name__ == '__main__':
    main()
