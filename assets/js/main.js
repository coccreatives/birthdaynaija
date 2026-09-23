/* BirthdayNaija landing page interactions */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------
     CONFIG
     Pricing is managed from the admin dashboard. Replace this
     object with the admin API response (same shape) so prices
     and packages can change without rebuilding the site.
     --------------------------------------------------------- */
  var BN_CONFIG = window.BN_CONFIG || {
    currency: '₦',
    /* Same 3 tiers used by the "Plans" section on the page and by the
       paywall step inside the forms (assets/js/forms.js). Keep both in
       sync by hand when this copy changes; there's no build step to
       share it automatically. */
    pricing: {
      oneoff: {
        name: '1. One Off', amount: 500, prefix: '', unit: '/ one time', unitShort: '',
        img: 'assets/img/package-oneoff.webp',
        tagline: 'Perfect for trying it out.',
        include: ['Birthday Wall entry', 'Shoutout', 'Choose your own challenge'],
        exclude: ['Wall slot', 'Priority booking', 'Automatic yearly renewal', 'Family and sibling coverage'],
        summary: 'Perfect for trying it out.',
        cta: 'Book once'
      },
      club: {
        name: '2. Club Member', amount: 15000, prefix: '', unit: '/ year', unitShort: '/yr',
        img: 'assets/img/package-club.webp',
        tagline: 'For members who want more access and exclusive benefits.',
        include: ['Everything in One Off', 'Dedicated wall slot', 'Shoutout', 'Priority booking', 'Automatic renewal every year'],
        exclude: ['Family and sibling coverage', 'Whole house membership'],
        summary: 'For members who want more access and exclusive benefits.',
        cta: 'Join the Club',
        popular: true
      },
      group: {
        name: '3. Family / Group', amount: 45000, prefix: '', unit: '/ year', unitShort: '/yr',
        img: 'assets/img/package-family.webp',
        tagline: 'For families who want to enjoy the benefits together.',
        include: ['Everything in Club Member', 'Cover parents', 'Cover siblings', 'Cover the whole house', 'Priority booking', 'Dedicated wall slot', 'Automatic yearly renewal'],
        exclude: [],
        excludeNote: 'No major benefits excluded.',
        summary: 'For families who want to enjoy the benefits together.',
        cta: 'Add my family'
      }
    },
    /* How many Wall entries show before "See more". Raise it, or let the
       admin API send it, once the real celebrants feed is wired up. */
    wallVisible: 8,
    /* Slides for the "Celebrate anyone" panel */
    slides: [
      { badge: 'BIRTHDAY WISHES', text: 'We celebrate you with a custom video shoutout, your name, your moment, made just for you.', cta: 'Book a shoutout', href: '#plans', form: 'celebrate', pkg: 'video' },
      { badge: 'FOR BUSINESSES', text: 'Celebrate your staff and customers with branded shoutouts, sponsored Wall sections and birthday campaigns.', cta: 'Partner with us', href: '#contact', form: 'business' },
      { badge: 'GIFTS AND EXPERIENCES', text: 'Send a gift box or a special birthday experience, and we make sure it lands on the day.', cta: 'Send a gift', href: '#plans', form: 'gift' }
    ]
  };

  // Exposed so assets/js/forms.js can build the paywall step from the
  // exact same pricing copy instead of a second, driftable copy.
  window.BN_CONFIG = BN_CONFIG;

  var fmt = function (n) { return BN_CONFIG.currency + Number(n).toLocaleString('en-NG'); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Arrow pair: the one you clicked becomes the active (dark) one ---------- */
  var setArrowDir = function (root, dir) {
    var pair = [['[data-prev]', 'prev'], ['[data-next]', 'next'], ['[data-rev-prev]', 'prev'], ['[data-rev-next]', 'next']];
    pair.forEach(function (x) {
      $$(x[0], root).forEach(function (b) {
        var on = x[1] === dir;
        b.classList.toggle('round-btn--dark', on);
        b.classList.toggle('round-btn--light', !on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
  };

  /* ---------- Pricing render (matches the Figma pricing-card spec) ---------- */
  var esc = function (s) { return String(s).replace(/</g, '&lt;'); };
  window.BN_renderPlanCard = function (p, opts) {
    opts = opts || {};
    var popular = !!p.popular;
    var include = (p.include || []).map(function (f) {
      return '<div class="plan__row-item plan__row-item--in"><span class="plan__ind plan__ind--in">✓</span><p>' + esc(f) + '</p></div>';
    }).join('');
    var excludeBody = (p.exclude && p.exclude.length)
      ? (p.exclude.map(function (f) {
          return '<div class="plan__row-item plan__row-item--out"><span class="plan__ind plan__ind--out">✕</span><p class="is-muted">' + esc(f) + '</p></div>';
        }).join(''))
      : (p.excludeNote ? '<p class="plan__excludenote">' + esc(p.excludeNote) + '</p>' : '');
    var ctaAttrs = opts.ctaAttrs || '';
    var media = p.img
      ? '<div class="plan__media"><img class="plan__img" src="' + esc(p.img) + '" alt="" loading="lazy">' +
        (popular ? '<span class="plan__popular">Most Popular</span>' : '') +
        '</div>'
      : '';
    return (
      media +
      '<div class="plan__body">' +
      '<div class="plan__row"><span class="plan__name">' + esc(p.name) + '</span></div>' +
      '<div class="plan__price"><b>' + fmt(p.amount) + '</b><span>' + esc(p.unit) + '</span></div>' +
      '<p class="plan__tag">' + esc(p.tagline || p.summary || '') + '</p>' +
      '<hr class="plan__hr">' +
      '<div class="plan__section"><p class="plan__label">What you get</p><div class="plan__rows">' + include + '</div></div>' +
      '<div class="plan__section"><p class="plan__label">Not included</p><div class="plan__rows">' + excludeBody + '</div></div>' +
      '<div class="plan__ctawrap"><' + (opts.ctaTag || 'a') + ' class="plan__cta' + (popular ? ' plan__cta--grad' : ' plan__cta--dark') + '"' + ctaAttrs + '>' + esc(p.cta) + '</' + (opts.ctaTag || 'a') + '></div>' +
      '</div>'
    );
  };
  $$('[data-plan]').forEach(function (card) {
    var key = card.getAttribute('data-plan');
    var p = BN_CONFIG.pricing[key];
    if (!p) return;
    card.classList.toggle('plan--popular', !!p.popular);
    var ctaExtra = {
      oneoff: ' href="#checkout" data-form="celebrate" data-package="wall"',
      club: ' href="#checkout" data-form="club" data-package="club"',
      group: ' href="#checkout" data-form="group" data-package="group"'
    };
    card.innerHTML = window.BN_renderPlanCard(p, { ctaTag: 'a', ctaAttrs: ctaExtra[key] || '' });
  });
  $$('[data-price="oneoff.amount"]').forEach(function (el) { el.textContent = fmt(BN_CONFIG.pricing.oneoff.amount); });

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Wall dates (Today / upcoming) ---------- */
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  $$('.wcard[data-offset]').forEach(function (card) {
    var off = parseInt(card.getAttribute('data-offset'), 10) || 0;
    var d = new Date(); d.setDate(d.getDate() + off);
    var label = off === 0 ? 'Today' : months[d.getMonth()] + ' ' + d.getDate();
    var el = $('.tag__date', card);
    if (el) el.textContent = label;
  });

  /* ---------- Birthday Wall: See more ----------
     The button only exists when there are more entries than fit. With
     8 or fewer cards nothing is rendered, so the section stays clean. */
  var wallGrid = $('#wall-grid');
  var wallMore = $('[data-wall-more]');
  var wallToggle = $('[data-wall-toggle]');
  if (wallGrid && wallMore && wallToggle) {
    var cards = $$('.wcard', wallGrid);
    var cap = BN_CONFIG.wallVisible || 8;
    if (cards.length > cap) {
      var open = false;
      var apply = function () {
        cards.forEach(function (c, i) { c.hidden = !open && i >= cap; });
        wallToggle.textContent = open ? 'Show less' : 'See more (' + (cards.length - cap) + ')';
        wallToggle.setAttribute('aria-expanded', String(open));
      };
      wallMore.hidden = false;
      apply();
      wallToggle.addEventListener('click', function () {
        open = !open;
        apply();
        if (!open) wallGrid.scrollIntoView({ block: 'start' });
        else $$('.wcard', wallGrid).slice(cap).forEach(function (c) { c.classList.add('is-in'); });
      });
    }
  }

  /* ---------- Section videos: force-start autoplay ----------
     The autoplay/muted/playsinline attributes alone are sometimes
     silently ignored by mobile browsers (the poster just sits there).
     Setting .muted in JS and calling .play() explicitly is the
     reliable way to get it going, and we retry on first touch/scroll
     in case the browser blocked the very first attempt. */
  (function () {
    var vids = $$('.panel__video');
    if (!vids.length) return;
    var kick = function () {
      vids.forEach(function (v) {
        v.muted = true;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
      });
    };
    kick();
    ['touchstart', 'scroll', 'click'].forEach(function (evt) {
      document.addEventListener(evt, kick, { once: true, passive: true });
    });
    vids.forEach(function (v) {
      v.addEventListener('loadeddata', kick);
      v.addEventListener('canplay', kick);
    });
  })();

  /* ---------- Sticky nav shadow ---------- */
  var nav = $('.nav');
  var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu: full-height overlay ---------- */
  var menuBtn = $('.nav__menu');
  var menu = $('#mobile-menu');
  var menuClose = $('[data-menu-close]', menu);
  var menuTimer = null;
  var closeMenu = function () {
    if (menu.hidden) return;
    clearTimeout(menuTimer);
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    // keep it in the flow until the slide-out finishes, then take it out
    menuTimer = setTimeout(function () { menu.hidden = true; }, 500);
  };
  var openMenu = function () {
    clearTimeout(menuTimer);
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    // next frame, so the transition has a start value to animate from
    requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
  };
  menuBtn.addEventListener('click', function () {
    if (menu.hidden || !menu.classList.contains('is-open')) openMenu(); else closeMenu();
  });
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Staggered word reveal ---------- */
  $$('[data-words]').forEach(function (el) {
    var parts = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    parts.forEach(function (w, i) {
      var sp = document.createElement('span');
      sp.className = 'w';
      sp.textContent = w;
      sp.style.setProperty('--wd', (i * 0.075) + 's');
      el.appendChild(sp);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  // stagger siblings inside grids
  $$('.club__grid, .wall__grid, .plans__grid, .reviews__track, .faq__list').forEach(function (g) {
    $$('.reveal', g).forEach(function (el, i) { el.style.setProperty('--d', (Math.min(i, 7) * 0.07) + 's'); });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Slider (Celebrate anyone panel) ---------- */
  var panel = $('[data-slider]');
  if (panel) {
    var slides = BN_CONFIG.slides;
    var idx = 0;
    var pagers = [panel].concat($$('[data-slider-remote]'));
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    pagers.forEach(function (root) {
      var dots = $('[data-dots]', root);
      if (dots) {
        dots.innerHTML = slides.map(function (_, i) {
          return '<button class="pager__dot" aria-label="Show slide ' + (i + 1) + '"></button>';
        }).join('');
        $$('.pager__dot', dots).forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
      }
      $$('[data-prev]', root).forEach(function (b) { b.addEventListener('click', function () { pagers.forEach(function (r) { setArrowDir(r, 'prev'); }); go(idx - 1); }); });
      $$('[data-next]', root).forEach(function (b) { b.addEventListener('click', function () { pagers.forEach(function (r) { setArrowDir(r, 'next'); }); go(idx + 1); }); });
    });

    var paint = function () {
      var s = slides[idx];
      $('[data-slide-badge]', panel).textContent = s.badge;
      $('[data-slide-text]', panel).textContent = s.text;
      $('[data-slide-num]', panel).textContent = pad(idx + 1);
      var cta = $('[data-slide-cta]', panel);
      cta.textContent = s.cta;
      cta.setAttribute('href', s.href);
      if (s.form) { cta.setAttribute('data-form', s.form); } else { cta.removeAttribute('data-form'); }
      if (s.pkg) { cta.setAttribute('data-package', s.pkg); } else { cta.removeAttribute('data-package'); }
      pagers.forEach(function (root) {
        $$('[data-count]', root).forEach(function (c) { c.textContent = pad(idx + 1) + ' / ' + pad(slides.length); });
        $$('.pager__dot', root).forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
      });
    };

    var busy = false;
    var go = function (n) {
      n = (n + slides.length) % slides.length;
      if (n === idx || busy) return;
      busy = true;
      panel.classList.add('is-swapping');
      setTimeout(function () {
        idx = n; paint();
        panel.classList.remove('is-swapping');
        busy = false;
      }, 320);
    };
    window.BN_goSlide = go;
    paint();

    // swipe on touch devices
    var sx = null;
    panel.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    panel.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
      sx = null;
    });

    // nav links that point at a specific slide
    $$('[data-go-slide]').forEach(function (a) {
      a.addEventListener('click', function () {
        var n = parseInt(a.getAttribute('data-go-slide'), 10);
        setTimeout(function () { go(n); }, 250);
      });
    });
  }

  /* ---------- Reviews carousel: one per screen ---------- */
  var track = $('[data-rev-track]');
  var prev = $('[data-rev-prev]');
  var next = $('[data-rev-next]');
  if (track && prev && next) {
    var revs = $$('.review', track);
    var ri = 0;
    var revRoot = prev.parentNode;
    var paintRev = function () {
      track.style.setProperty('--i', ri);
      revs.forEach(function (c, i) { c.classList.toggle('is-active', i === ri); });
    };
    var goRev = function (n) {
      ri = (n + revs.length) % revs.length;
      paintRev();
    };
    prev.addEventListener('click', function () { setArrowDir(revRoot, 'prev'); goRev(ri - 1); });
    next.addEventListener('click', function () { setArrowDir(revRoot, 'next'); goRev(ri + 1); });
    // swipe
    var rx = null;
    track.addEventListener('touchstart', function (e) { rx = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (rx === null) return;
      var dx = e.changedTouches[0].clientX - rx;
      if (Math.abs(dx) > 40) { setArrowDir(revRoot, dx < 0 ? 'next' : 'prev'); goRev(ri + (dx < 0 ? 1 : -1)); }
      rx = null;
    });
    paintRev();
  }

  /* ---------- FAQ accordion ---------- */
  $$('.qa').forEach(function (qa) {
    var btn = $('.qa__q', qa);
    btn.addEventListener('click', function () {
      var open = !qa.classList.contains('is-open');
      $$('.qa.is-open').forEach(function (o) { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); });
      qa.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Count up ---------- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  $$('[data-countup]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-countup'), 10);
    if (reduce || !('IntersectionObserver' in window)) return;
    var ran = false;
    var cio = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting || ran) return;
      ran = true; cio.disconnect();
      var t0 = null, dur = 1800;
      var tick = function (t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(target * e).toLocaleString('en-US');
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    cio.observe(el);
  });
})();
