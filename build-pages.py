#!/usr/bin/env python3
"""Generate the standalone pages from backstreet-cafe.html.

The site was one page with #anchors. Six URLs serving JavaScript-only content
rank no better than one, but the menu, the schema and the recognitions are now
rendered into the HTML, so a page per subject has something real behind it.

Only the subjects that HAVE content get a page. /coffee and /awards are
deliberately not generated: there is no coffee section anywhere on the site,
and the recognitions already sit inside /about, so a separate page would be
four duplicated lines.

Run AFTER build-menu.py, which regenerates the menu inside the homepage:

    python3 build-menu.py && python3 build-pages.py

Standard library only. There is no build step in this project.
"""

import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
HOME = os.path.join(ROOT, 'backstreet-cafe.html')
SITE = 'https://backstreetcafe.com.au'


def read(path):
    return open(path, encoding='utf-8').read()


def block(html, marker, nxt):
    """The markup between two of the page's own section comments."""
    i = html.find('<!-- %s -->' % marker)
    j = html.find('<!-- %s -->' % nxt) if nxt else len(html)
    if i < 0 or j < 0:
        raise SystemExit('section %s not found' % marker)
    return html[i:j].rstrip() + '\n'


def head_of(html):
    """Everything the pages share: charset, fonts, stylesheet, business schema."""
    fonts = '\n'.join(re.findall(r'<link[^>]*(?:fonts\.(?:googleapis|gstatic)|site\.css)[^>]*>', html))
    icons = '\n'.join(re.findall(r'<link[^>]*rel="(?:icon|apple-touch-icon)"[^>]*>', html))
    business = re.search(
        r'<script type="application/ld\+json">\s*\{\s*"@context".*?"@type": "CafeOrCoffeeShop".*?</script>',
        html, re.S)
    return fonts, icons, (business.group(0) if business else '')


def page(title, description, path, body, fonts, icons, schema, extra_head='', scripts=''):
    canonical = SITE + path
    return f"""<!doctype html>
<html lang="en-AU">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{SITE}/assets/og-image.jpg">
{icons}
{fonts}
{schema}
{extra_head}
</head>
<body>
<div id="page-clip">
{body}
</div>
<script src="/assets/supabase-config.js"></script>
{scripts}<script src="/assets/site.js" defer></script>
</body>
</html>
"""


FIND_US = """
<!-- FIND US -->
<!-- .about is a two-column grid built around a photograph. There is no photo
     here, so the second column is collapsed rather than left as a dead half. -->
<section class="about" id="find-us" style="grid-template-columns:1fr;">
  <div class="about-content reveal" style="padding-top:120px;max-width:760px;">
    <div class="section-label"><span>Find Us</span></div>
    <h1 class="section-title">Backstreet Cafe,<br><em>Mooloolaba</em></h1>
    <p class="section-body">
      Shop 3/121 Mooloolaba Esplanade, Mooloolaba QLD 4557 &mdash; inside Mantra Mooloolaba Beach,
      steps from the sand.
    </p>
    <div class="about-values">
      <div class="value-item">
        <h4>Hours</h4>
        <p>Monday to Thursday, 6am to 1pm.<br>Friday to Sunday, 6am to 2pm.</p>
      </div>
      <div class="value-item">
        <h4>Bookings</h4>
        <p>Walk-ins only &mdash; we do not take bookings. Just come as you are.</p>
      </div>
    </div>
    <div class="about-awards">
      <h4>Getting here</h4>
      <ul class="award-list">
        <li>
          <a href="https://www.google.com/maps/search/?api=1&amp;query=Shop%203%2F121%20Mooloolaba%20Espl%2C%20Mooloolaba%20QLD%204557" target="_blank" rel="noopener noreferrer">Open in Google Maps</a>
          <cite>Shop 3/121 Mooloolaba Esplanade</cite>
        </li>
      </ul>
    </div>
  </div>
</section>
"""


def main():
    html = read(HOME)
    fonts, icons, schema = head_of(html)
    nav = block(html, 'NAV', 'HERO')
    footer = block(html, 'FOOTER', None)
    footer = footer.split('<script')[0].rstrip() + '\n'
    about = block(html, 'ABOUT', 'MENU PARALLAX BREAK')
    menu = block(html, 'MENU SECTION', 'HOURS & FIND US')

    menu_schema = re.search(
        r'<!-- menu:schema:start -->.*?<!-- menu:schema:end -->', html, re.S)
    menu_schema = menu_schema.group(0) if menu_schema else ''

    # The homepage keeps its h1; a sub-page needs its own, so the section
    # heading is promoted in place rather than a second h1 being invented.
    about_page = about.replace('<h2 class="section-title">', '<h1 class="section-title">', 1)
    about_page = about_page.replace('</h2>', '</h1>', 1)
    menu_page = menu.replace('<h2 class="section-title">', '<h1 class="section-title">', 1)
    menu_page = menu_page.replace('</h2>', '</h1>', 1)

    pages = [
        ('menu.html', '/menu',
         'Menu | Backstreet Cafe, Mooloolaba',
         'The full Backstreet Cafe menu: breakfast, lunch, burgers and coffee at Mooloolaba Beach. Prices current, dietary options marked.',
         menu_page, menu_schema,
         '<script src="/assets/menu-browser.js" defer></script>\n'),
        ('about.html', '/about',
         'Our Story | Backstreet Cafe, Mooloolaba',
         'Backstreet Cafe has been on the Sunshine Coast since 2016. Specialty coffee, house-made food, local producers, and where to find us.',
         about_page, ''),
        ('find-us.html', '/find-us',
         'Find Us | Backstreet Cafe, Mooloolaba',
         'Backstreet Cafe is at Shop 3/121 Mooloolaba Esplanade. Open 6am Monday to Sunday, walk-ins only. Hours, address and directions.',
         FIND_US, ''),
    ]

    for entry in pages:
        filename, path, title, desc, body, extra = entry[:6]
        scripts = entry[6] if len(entry) > 6 else ''
        out = page(title, desc, path, nav + body + footer, fonts, icons, schema,
                   extra, scripts)
        open(os.path.join(ROOT, filename), 'w', encoding='utf-8').write(out)
        print('%-16s %6.1f KB  %s' % (filename, len(out) / 1024, path))

    urls = ['/', '/menu', '/about', '/find-us']
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + ''.join('  <url><loc>%s%s</loc></url>\n' % (SITE, u) for u in urls)
               + '</urlset>\n')
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(sitemap)
    print('%-16s %6d urls' % ('sitemap.xml', len(urls)))


if __name__ == '__main__':
    main()
