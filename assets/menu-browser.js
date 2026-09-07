(function () {
  const MENU_IMG_BASE = 'https://backstreet-cafe-menu.netlify.app';
  const FALLBACK_URL = '/assets/menu-data.json';

  // Badges live in the database. The bundled JSON is only a safety net for when
  // Supabase is unreachable, so it carries the two highlights inline.
  const FALLBACK_BADGES = {
    b2: 'Backstreet Favourite',
    b8: 'Signature'
  };

  const CATEGORY_LABELS = {
    BREAKFAST: 'Breakfast',
    BIG_BREAKFAST: 'Big Breakfast',
    SWEET_BREAKFAST: 'Sweet Breakfast',
    KIDS_STUFF: 'Kids Stuff',
    LUNCH: 'Lunch Menu',
    BURGERS: 'BackStreet Burgers',
    SIDES: 'Sides',
    EXTRA_BITS: 'Extra Bits',
    DRINKS_HOT: 'Hot Stuff',
    DRINKS_COLD: 'Cold Stuff',
    DRINKS_SWIRLS: 'Swirls',
    BEER_COCKTAILS: 'Beer & Cocktails'
  };

  const TAB_GROUPS = {
    breakfast: ['BREAKFAST', 'BIG_BREAKFAST', 'SWEET_BREAKFAST', 'KIDS_STUFF'],
    lunch: ['LUNCH', 'BURGERS', 'SIDES', 'EXTRA_BITS'],
    drinks: ['DRINKS_HOT', 'DRINKS_COLD', 'DRINKS_SWIRLS', 'BEER_COCKTAILS']
  };

  // Rendered as a plain price list — no photos, no detail modal.
  const LIST_ONLY_CATEGORIES = ['EXTRA_BITS'];

  const TAG_LABELS = {
    gf: 'Gluten Free',
    gfo: 'GF Option',
    v: 'Vegetarian',
    vg: 'Vegan',
    df: 'Dairy Free'
  };

  const root = document.getElementById('menu-browser');
  if (!root) return;

  const tabsEl = root.querySelector('.menu-tabs');
  const searchEl = root.querySelector('.menu-search-input');
  const featuredEl = root.querySelector('.menu-featured');
  const catalogEl = root.querySelector('.menu-catalog');
  const modalEl = document.getElementById('menu-item-modal');
  const modalCloseEl = modalEl?.querySelector('.menu-modal-close');
  const modalBodyEl = modalEl?.querySelector('.menu-modal-body');

  let menuItems = [];
  let activeTab = 'breakfast';
  let searchQuery = '';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(price) {
    return `$${Number(price || 0).toFixed(2)}`;
  }

  function imageSrc(item) {
    if (!item.imageUrl) return '';
    const url = item.imageUrl.startsWith('http')
      ? item.imageUrl
      : `${MENU_IMG_BASE}${item.imageUrl}`;
    // Menu photo filenames contain spaces and brackets.
    return encodeURI(url);
  }

  function itemMatchesSearch(item) {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      (CATEGORY_LABELS[item.category] || '').toLowerCase().includes(query)
    );
  }

  function renderTags(tags) {
    if (!tags?.length) return '';
    return `<div class="menu-item-tags">${tags
      .map((tag) => `<span class="menu-item-tag">${escapeHtml(TAG_LABELS[tag] || tag)}</span>`)
      .join('')}</div>`;
  }

  function renderItemRow(item) {
    const img = imageSrc(item);
    return `
      <article class="menu-item-row" data-item-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(item.name)}">
        ${img ? `<div class="menu-item-thumb"><img src="${escapeHtml(img)}" alt="" loading="lazy"></div>` : ''}
        <div class="menu-item-body">
          <div class="menu-item-head">
            <h3 class="menu-item-name">${escapeHtml(item.name)}</h3>
            <span class="menu-item-price">${formatPrice(item.price)}</span>
          </div>
          <p class="menu-item-desc">${escapeHtml(item.description)}</p>
          ${renderTags(item.tags)}
        </div>
      </article>
    `;
  }

  function renderExtraListItem(item) {
    return `
      <li class="menu-extra-item">
        <span class="menu-extra-name">${escapeHtml(item.name)}</span>
        <span class="menu-extra-price">${formatPrice(item.price)}</span>
      </li>
    `;
  }

  function renderCategoryItems(categoryKey, items) {
    if (LIST_ONLY_CATEGORIES.includes(categoryKey)) {
      return `<ul class="menu-extra-list">${items.map(renderExtraListItem).join('')}</ul>`;
    }
    return `<div class="menu-item-list">${items.map(renderItemRow).join('')}</div>`;
  }

  function renderFeatured(featuredItems) {
    if (!featuredItems.length || searchQuery) {
      featuredEl.hidden = true;
      featuredEl.innerHTML = '';
      return;
    }

    const cards = featuredItems.map((item) => {
      const img = imageSrc(item);
      return `
        <article class="menu-featured-card" data-item-id="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(item.name)}">
          ${img ? `<img class="menu-featured-img" src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}" loading="lazy">` : ''}
          <div class="menu-featured-overlay"></div>
          <div class="menu-featured-content">
            <span class="menu-featured-badge">${escapeHtml(item.badge)}</span>
            <h3 class="menu-featured-name">${escapeHtml(item.name)}</h3>
            <p class="menu-featured-desc">${escapeHtml(item.description)}</p>
            <span class="menu-featured-price">${formatPrice(item.price)}</span>
          </div>
        </article>
      `;
    });

    featuredEl.hidden = false;
    featuredEl.innerHTML = `
      <div class="menu-featured-header">
        <h3 class="menu-featured-title">Signatures &amp; Favourites</h3>
      </div>
      <div class="menu-featured-grid">${cards.join('')}</div>
    `;
  }

  function renderCatalog() {
    const categories = TAB_GROUPS[activeTab] || [];
    const inTab = menuItems.filter((item) => categories.includes(item.category));
    const featuredItems = searchQuery ? [] : inTab.filter((item) => item.badge);
    const featuredIds = new Set(featuredItems.map((item) => item.id));

    const sections = categories.map((categoryKey) => {
      const items = inTab.filter((item) => {
        if (item.category !== categoryKey) return false;
        if (featuredIds.has(item.id)) return false;
        return itemMatchesSearch(item);
      });

      if (!items.length) return '';

      return `
        <section class="menu-category-block">
          <div class="menu-category-head">
            <h3 class="menu-category-title">${escapeHtml(CATEGORY_LABELS[categoryKey] || categoryKey)}</h3>
            <div class="menu-category-line"></div>
          </div>
          ${renderCategoryItems(categoryKey, items)}
        </section>
      `;
    }).filter(Boolean);

    renderFeatured(featuredItems);

    catalogEl.innerHTML = sections.length
      ? sections.join('')
      : (featuredEl.hidden
        ? '<div class="menu-empty"><p>No items found. Try another search or category.</p></div>'
        : '');
  }

  function openModal(itemId) {
    const item = menuItems.find((entry) => entry.id === itemId);
    if (!item || !modalEl || !modalBodyEl) return;

    const img = imageSrc(item);
    modalBodyEl.innerHTML = `
      ${img ? `<div class="menu-modal-media"><img src="${escapeHtml(img)}" alt="${escapeHtml(item.name)}"></div>` : ''}
      <div class="menu-modal-content">
        <div class="menu-modal-head">
          <h2 id="menu-modal-title">${escapeHtml(item.name)}</h2>
          <span class="menu-modal-price">${formatPrice(item.price)}</span>
        </div>
        <p class="menu-modal-desc">${escapeHtml(item.description)}</p>
        ${renderTags(item.tags)}
      </div>
    `;

    modalEl.hidden = false;
    document.body.style.overflow = 'hidden';
    modalCloseEl?.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.style.overflow = '';
  }

  function bindInteractions() {
    tabsEl?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-menu-tab]');
      if (!button) return;
      activeTab = button.dataset.menuTab;
      tabsEl.querySelectorAll('[data-menu-tab]').forEach((tab) => {
        const isActive = tab.dataset.menuTab === activeTab;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      renderCatalog();
    });

    searchEl?.addEventListener('input', (event) => {
      searchQuery = event.target.value.trim();
      renderCatalog();
    });

    root.addEventListener('click', (event) => {
      const target = event.target.closest('[data-item-id]');
      if (!target) return;
      openModal(target.dataset.itemId);
    });

    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest('[data-item-id]');
      if (!target) return;
      event.preventDefault();
      openModal(target.dataset.itemId);
    });

    modalCloseEl?.addEventListener('click', closeModal);
    modalEl?.addEventListener('click', (event) => {
      if (event.target === modalEl) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modalEl && !modalEl.hidden) closeModal();
    });
  }

  async function fetchFromSupabase() {
    const config = window.BACKSTREET_SUPABASE;
    if (!config?.url || !config.publishableKey || config.publishableKey.startsWith('PASTE_')) {
      return null;
    }

    const endpoint = `${config.url}/rest/v1/menu_items`
      + '?select=id,name,description,price,category,image_url,tags,badge'
      + '&is_available=eq.true'
      + '&order=category.asc,sort_order.asc,name.asc';

    const response = await fetch(endpoint, {
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${config.publishableKey}`
      }
    });

    if (!response.ok) throw new Error(`Supabase responded ${response.status}`);

    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return null;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      price: Number(row.price),
      category: row.category,
      imageUrl: row.image_url || null,
      tags: row.tags || [],
      badge: row.badge || null
    }));
  }

  async function fetchFallback() {
    const response = await fetch(FALLBACK_URL);
    if (!response.ok) throw new Error('Menu data unavailable');
    const rows = await response.json();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      price: Number(row.price),
      category: row.category,
      imageUrl: row.imageUrl || null,
      tags: row.tags || [],
      badge: FALLBACK_BADGES[row.id] || null
    }));
  }

  async function init() {
    bindInteractions();

    try {
      menuItems = (await fetchFromSupabase()) || (await fetchFallback());
      renderCatalog();
    } catch (error) {
      try {
        menuItems = await fetchFallback();
        renderCatalog();
      } catch {
        catalogEl.innerHTML = `
          <div class="menu-empty">
            <p>Our menu is not loading right now. Please check back shortly.</p>
          </div>
        `;
      }
    }
  }

  init();
})();
