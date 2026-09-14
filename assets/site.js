// Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach(el => observer.observe(el));

  const instagramFeedGrid = document.getElementById('instagram-feed-grid');

  function observeRevealElements(elements) {
    elements.forEach((el) => observer.observe(el));
  }

  function escapeAttribute(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // Photos are managed from /admin. The markup already in the page stays as the
  // fallback whenever Supabase is unreachable or the gallery is still empty.
  async function loadGallery() {
    if (!instagramFeedGrid) return;

    const config = window.BACKSTREET_SUPABASE;
    const hasConfig = config?.url
      && config.publishableKey
      && !config.publishableKey.startsWith('PASTE_');

    if (hasConfig) {
      try {
        const endpoint = `${config.url}/rest/v1/gallery_images`
          + '?select=image_url,alt_text,link_url'
          + '&is_visible=eq.true'
          + '&order=sort_order.asc,created_at.asc'
          + '&limit=8';

        const response = await fetch(endpoint, {
          headers: {
            apikey: config.publishableKey,
            Authorization: `Bearer ${config.publishableKey}`
          }
        });

        if (response.ok) {
          const rows = await response.json();
          if (Array.isArray(rows) && rows.length) {
            instagramFeedGrid.innerHTML = rows.map((row) => {
              const src = escapeAttribute(encodeURI(row.image_url));
              const alt = escapeAttribute(row.alt_text || 'Backstreet Cafe');
              const inner = `<img class="gallery-img" src="${src}" alt="${alt}" loading="lazy"><div class="gallery-item-overlay"></div>`;

              return row.link_url
                ? `<a class="gallery-item reveal" href="${escapeAttribute(row.link_url)}" target="_blank" rel="noopener noreferrer" aria-label="View Instagram post">${inner}</a>`
                : `<div class="gallery-item reveal">${inner}</div>`;
            }).join('');
          }
        }
      } catch (error) {
        // Keep the fallback markup already rendered in the page.
      }
    }

    observeRevealElements(instagramFeedGrid.querySelectorAll('.reveal'));
  }

  loadGallery();

  // Nav scroll effect
  const nav = document.querySelector('nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const heroVideo = document.getElementById('hero-video');
  const heroVideoArea = document.getElementById('hero-video-area');
  const heroSoundToggle = document.getElementById('hero-sound-toggle');
  const fogoBanner = document.querySelector('.fogo-banner');
  const fogoBannerImage = document.querySelector('.fogo-banner-image');
  const menuParallaxBreak = document.querySelector('.menu-parallax-break');
  const menuParallaxImage = document.querySelector('.menu-parallax-img');

  if (nav && navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('menu-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && nav.classList.contains('menu-open')) {
        nav.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (heroVideo && heroSoundToggle) {
    const syncSoundButton = () => {
      heroSoundToggle.textContent = heroVideo.muted ? 'Unmute' : 'Mute';
      heroSoundToggle.setAttribute('aria-label', heroVideo.muted ? 'Unmute video' : 'Mute video');
    };

    const toggleVideoSound = async () => {
      heroVideo.muted = !heroVideo.muted;
      syncSoundButton();

      if (!heroVideo.muted) {
        try {
          await heroVideo.play();
        } catch (error) {
          heroVideo.muted = true;
          syncSoundButton();
        }
      }
    };

    heroVideo.muted = true;
    heroVideo.play().finally(() => {
      syncSoundButton();
    });

    heroSoundToggle.addEventListener('click', async (event) => {
      event.stopPropagation();
      await toggleVideoSound();
    });

    heroVideoArea?.addEventListener('click', async (event) => {
      if (event.target === heroSoundToggle) return;
      await toggleVideoSound();
    });
  }

  window.addEventListener('scroll', () => {
    const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
    if (window.scrollY > 60) {
      nav.style.boxShadow = '0 2px 30px rgba(26,18,8,0.08)';
    } else {
      nav.style.boxShadow = 'none';
    }

    if (window.scrollY > heroHeight - 140) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    if (fogoBanner && fogoBannerImage) {
      const rect = fogoBanner.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.bottom > 0 && rect.top < viewport) {
        const progress = ((viewport - rect.top) / (viewport + rect.height)) - 0.5;
        const parallaxOffset = progress * 64;
        fogoBannerImage.style.setProperty('--fogo-parallax', `${parallaxOffset.toFixed(2)}px`);
      }
    }

    if (menuParallaxBreak && menuParallaxImage) {
      const rect = menuParallaxBreak.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (rect.bottom > 0 && rect.top < viewport) {
        const progress = ((viewport - rect.top) / (viewport + rect.height)) - 0.5;
        const parallaxOffset = progress * 48;
        menuParallaxImage.style.setProperty('--menu-parallax', `${parallaxOffset.toFixed(2)}px`);
      }
    }
  });

  window.dispatchEvent(new Event('scroll'));
