/* ============================================================
   INTREPID HOCKEY — main.js
   Custom cursor · Mobile nav · Scroll reveals · Process tabs
   Stat counters · Hero parallax
   ============================================================ */

/* ── CUSTOM CURSOR (mouse devices only) ───────────────────── */
(function () {
  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;

  let mx = window.innerWidth  / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my;

  let rafId = null;
  function lerp() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    /* Stop the loop once the ring has caught up — saves CPU/battery when idle */
    if (Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1) {
      rx = mx; ry = my;
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(lerp);
  }

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    if (rafId === null) rafId = requestAnimationFrame(lerp);
  });

  const hoverSel = 'a, button, .pcard, .svc, .process-tab, [data-cursor]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverSel)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', () => {
    document.body.classList.remove('cursor-hover');
  });
})();

/* ── MOBILE NAV ────────────────────────────────────────────── */
(function () {
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer    = document.querySelector('.mobile-nav');
  const overlay   = document.querySelector('.mobile-nav-overlay');
  if (!hamburger || !drawer || !overlay) return;

  const links = [...drawer.querySelectorAll('a')];

  function open() {
    hamburger.classList.add('open');
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    hamburger.setAttribute('aria-label', 'Close navigation menu');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    /* Move focus into the drawer once it has slid in */
    if (links.length) requestAnimationFrame(() => links[0].focus());
  }

  function close(returnFocus) {
    hamburger.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    /* Return focus to the toggle unless a link was clicked (page navigates) */
    if (returnFocus !== false) hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? close() : open();
  });
  overlay.addEventListener('click', () => close());
  links.forEach((a) => a.addEventListener('click', () => close(false)));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.classList.contains('open')) close();
  });

  /* Focus trap — keep Tab within the open drawer */
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !drawer.classList.contains('open') || !links.length) return;
    const first = links[0], last = links[links.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();

/* ── REVEAL ON SCROLL ──────────────────────────────────────── */
(function () {
  const els = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach((el) => io.observe(el));
})();

/* ── PERIOD CARDS — SCROLL ACTIVATION (MOBILE) ────────────── */
(function () {
  if (!window.matchMedia('(max-width: 980px)').matches) return;
  const cards = document.querySelectorAll('.svc');
  if (!cards.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('svc-active');
        io.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '-40% 0px -40% 0px',
    threshold: 0
  });

  cards.forEach((card) => io.observe(card));
})();

/* ── PROCESS TABS + MOBILE ACCORDION ──────────────────────── */
(function () {
  const stageTabs = document.querySelector('.process-stage-tabs');
  const tabs      = [...document.querySelectorAll('.process-tab')];
  const panels    = [...document.querySelectorAll('.process-panel')];
  if (!tabs.length) return;

  let activeIdx = 0;
  let animating = false;
  let animGen   = 0;   /* increments on every activate() call — stale timeouts bail when they see a newer gen */

  /* ── Rail spring physics ─────────────────────────────────── */
  /* Underdamped spring (ζ ≈ 0.79) — fills with momentum and a
     subtle overshoot so the bar feels like it has weight.
     Picks up from current position mid-flight, so rapid tab
     clicks chain naturally instead of jumping. */
  const STIFFNESS = 160, DAMPING = 20;
  const rail = { pos: 25, vel: 0, target: 25, rafId: null };

  function tickRail() {
    const dt  = 1 / 60;
    const acc = -STIFFNESS * (rail.pos - rail.target) - DAMPING * rail.vel;
    rail.vel += acc * dt;
    rail.pos += rail.vel * dt;
    stageTabs.style.setProperty('--rail-fill', rail.pos.toFixed(2) + '%');
    if (Math.abs(rail.pos - rail.target) < 0.02 && Math.abs(rail.vel) < 0.02) {
      rail.pos   = rail.target;
      rail.vel   = 0;
      rail.rafId = null;
      stageTabs.style.setProperty('--rail-fill', rail.target + '%');
    } else {
      rail.rafId = requestAnimationFrame(tickRail);
    }
  }

  function setRailFill(pct) {
    if (!stageTabs) return;
    rail.target = pct;
    if (!rail.rafId) rail.rafId = requestAnimationFrame(tickRail);
  }

  /* Initialise tabindex — active tab focusable, others not */
  tabs.forEach((tab, i) => tab.setAttribute('tabindex', i === 0 ? '0' : '-1'));

  /* ── activate(index) ─────────────────────────────────────── */
  function activate(index) {
    if (index === activeIdx && panels[index] && !panels[index].classList.contains('hidden')) return;

    const prevIdx  = activeIdx;
    activeIdx      = index;

    /* Tab states + tabindex */
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle('active', on);
      tab.setAttribute('aria-selected', String(on));
      tab.setAttribute('tabindex', on ? '0' : '-1');
    });

    /* Progress rail — spring-driven */
    setRailFill((index + 1) / tabs.length * 100);

    /* Cross-fade panels */
    const prevPanel = panels[prevIdx];
    const nextPanel = panels[index];
    /* Cancel any in-flight animation so rapid clicks never get stuck */
    animGen++;
    panels.forEach(p => p.classList.remove('panel-fade-out', 'panel-fade-in'));
    animating = false;

    if (!prevPanel || prevIdx === index) {
      panels.forEach((p, i) => p.classList.toggle('hidden', i !== index));
      return;
    }

    const myGen = animGen;
    animating = true;
    prevPanel.classList.add('panel-fade-out');

    setTimeout(() => {
      if (animGen !== myGen) return;   /* a newer click happened — bail */
      prevPanel.classList.add('hidden');
      prevPanel.classList.remove('panel-fade-out');
      nextPanel.classList.remove('hidden');
      nextPanel.classList.add('panel-fade-in');
      setTimeout(() => {
        if (animGen !== myGen) return; /* a newer click happened — bail */
        nextPanel.classList.remove('panel-fade-in');
        animating = false;
      }, 200);
    }, 150);
  }

  /* Click — the only trigger (mouseenter removed: it's noise, not signal) */
  tabs.forEach((tab, i) => tab.addEventListener('click', () => activate(i)));

  /* Keyboard: WAI-ARIA Tabs pattern (arrow keys, Home, End) */
  tabs.forEach((tab, i) => {
    tab.addEventListener('keydown', (e) => {
      let next;
      if      (e.key === 'ArrowDown'  || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowUp'    || e.key === 'ArrowLeft')  next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home')                                  next = 0;
      else if (e.key === 'End')                                   next = tabs.length - 1;
      if (next !== undefined) {
        e.preventDefault();
        activate(next);
        tabs[next].focus();
      }
    });
  });

  /* Init rail at 25% (tab 01 active) — instant, no spring */
  if (stageTabs) {
    rail.pos = 25;
    stageTabs.style.setProperty('--rail-fill', '25%');
  }

  /* ── MOBILE ACCORDION ────────────────────────────────────── */
  const stage = document.querySelector('.process-stage');
  if (!stage) return;

  /* Build accordion DOM from existing tab + panel data */
  const accordion = document.createElement('div');
  accordion.className = 'process-accordion';
  stage.insertAdjacentElement('afterend', accordion);

  tabs.forEach((tab, i) => {
    const panel   = panels[i];
    const label   = tab.querySelector('span:not(.num)').textContent;
    const num     = tab.querySelector('.num').textContent;
    const titleEl = panel.querySelector('.process-panel-title');
    const descEl  = panel.querySelector('.process-panel-desc');
    const listEl  = panel.querySelector('.process-panel-list');
    const svgEl   = panel.querySelector('svg.process-panel-img');

    const item = document.createElement('div');
    item.className = 'acc-item';
    item.innerHTML =
      `<button class="acc-head" id="acc-head-${i}" aria-expanded="false"
               aria-controls="acc-body-${i}">
        <span class="acc-num">${num}</span>
        <span class="acc-label">${label}</span>
        ${svgEl ? `<span class="acc-icon-wm" aria-hidden="true">${svgEl.outerHTML}</span>` : ''}
        <svg class="acc-chevron" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="acc-body" id="acc-body-${i}" role="region" aria-labelledby="acc-head-${i}">
        <div class="acc-content">
          ${svgEl  ? svgEl.outerHTML   : ''}
          <h3 class="process-panel-title">${titleEl ? titleEl.innerHTML   : ''}</h3>
          <p  class="process-panel-desc">${descEl  ? descEl.innerHTML   : ''}</p>
          <ul class="process-panel-list">${listEl  ? listEl.innerHTML    : ''}</ul>
        </div>
      </div>`;

    accordion.appendChild(item);
  });

  /* Accordion toggle logic — single-open, smooth max-height */
  const accHeads  = [...accordion.querySelectorAll('.acc-head')];
  const accBodies = [...accordion.querySelectorAll('.acc-body')];
  const accItems  = [...accordion.querySelectorAll('.acc-item')];

  function openAcc(idx) {
    accHeads[idx].setAttribute('aria-expanded', 'true');
    accItems[idx].classList.add('acc-item--open'); // class first → headline becomes display:block
    // setTimeout lets the browser flush the class change to layout before we
    // measure scrollHeight (same-tick reads return stale pre-class values).
    setTimeout(() => {
      if (accItems[idx].classList.contains('acc-item--open')) {
        accBodies[idx].style.maxHeight = accBodies[idx].scrollHeight + 'px';
      }
    }, 0);
  }

  function closeAcc(idx) {
    accHeads[idx].setAttribute('aria-expanded', 'false');
    const body = accBodies[idx];
    // After the open animation finishes we set maxHeight:'none' (see transitionend
    // below) so the CSS transition has nothing to animate from. Snap to a px
    // value first, flush layout, then set 0 so the close transition runs.
    if (!body.style.maxHeight || body.style.maxHeight === 'none') {
      body.style.maxHeight = body.scrollHeight + 'px';
      body.getBoundingClientRect(); // force reflow
    }
    body.style.maxHeight = '0';
    accItems[idx].classList.remove('acc-item--open');
  }

  // After the open animation completes, lift the max-height cap entirely so
  // content is never clipped regardless of font metrics or dynamic resizing.
  accBodies.forEach((body, i) => {
    body.addEventListener('transitionend', e => {
      if (e.propertyName !== 'max-height') return;
      if (accItems[i].classList.contains('acc-item--open')) {
        body.style.maxHeight = 'none';
      }
    });
  });

  accHeads.forEach((head, i) => {
    head.addEventListener('click', () => {
      const isOpen = head.getAttribute('aria-expanded') === 'true';
      accHeads.forEach((_, j) => closeAcc(j));
      if (!isOpen) openAcc(i);
    });
  });

  /* All items start closed — user opens on demand */
})();

/* ── GDPR CONSENT — disable submit until checkbox checked ──── */
(function () {
  const cb     = document.getElementById('gdpr-consent');
  const btn    = document.getElementById('eval-submit-btn');
  const errMsg = document.getElementById('consent-error');
  const form   = btn && btn.closest('form');
  if (!cb || !btn || !form || !errMsg) return;

  function syncBtn() {
    btn.disabled = !cb.checked;
    if (cb.checked) errMsg.hidden = true;
  }

  cb.addEventListener('change', syncBtn);
  syncBtn(); // init

  form.addEventListener('submit', (e) => {
    if (!cb.checked) {
      e.preventDefault();
      errMsg.hidden = false;
      cb.focus();
    }
  });
})();

/* ── HERO ROW-1 "NEW" — start at Row-2 teal position ──────── */
(function () {
  function positionSwapNew() {
    const swapWord  = document.querySelector('.mf-swap .word');
    const row2New   = document.querySelector('.mf-new-echo');
    const swapSpan  = document.querySelector('.mf-swap .word > span');
    if (!swapWord || !row2New || !swapSpan) return;

    const r1 = swapWord.getBoundingClientRect();
    const r2 = row2New.getBoundingClientRect();
    swapSpan.style.transform = 'translateY(' + (r2.top - r1.top) + 'px)';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(positionSwapNew);
    });
  } else {
    requestAnimationFrame(positionSwapNew);
  }
})();

/* ── HERO PLAYER PARALLAX (desktop only) ───────────────────── */
(function () {
  const player = document.getElementById('hero-player');
  if (!player) return;

  const mql = window.matchMedia('(max-width: 880px)');
  let ticking = false;

  function render() {
    ticking = false;
    const y = window.scrollY;
    player.style.transform =
      `translate3d(${y * 0.05}px, ${y * 0.15}px, 0) scale(${1 + y * 0.0003})`;
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }

  function apply(e) {
    if (e.matches) {
      /* Switched to / loaded on mobile — detach and reset */
      window.removeEventListener('scroll', onScroll);
      player.style.transform = '';
    } else {
      /* Switched to / loaded on desktop — attach */
      window.addEventListener('scroll', onScroll, { passive: true });
    }
  }

  mql.addEventListener('change', apply);
  apply(mql); /* run once on load to set initial state */
})();

/* ── BACK TO TOP (mobile only) ─────────────────────────────── */
(function () {
  const btn    = document.querySelector('.back-to-top');
  const footer = document.querySelector('footer');
  if (!btn) return;

  const THRESHOLD = 300;
  const mql = window.matchMedia('(max-width: 768px)');

  function setVisible(visible) {
    btn.classList.toggle('is-visible', visible);
    btn.setAttribute('aria-hidden', visible ? 'false' : 'true');
    btn.setAttribute('tabindex',    visible ? '0'     : '-1');
  }

  function update() {
    /* Hide when past threshold AND footer is not yet in viewport */
    const footerVisible = footer && footer.getBoundingClientRect().top < window.innerHeight;
    setVisible(window.scrollY > THRESHOLD && !footerVisible);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }

  function apply(e) {
    if (e.matches) {
      /* Switched to / loaded on mobile — attach scroll listener */
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    } else {
      /* Switched to / loaded on desktop — detach and hide button */
      window.removeEventListener('scroll', onScroll);
      setVisible(false);
    }
  }

  btn.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  mql.addEventListener('change', apply);
  apply(mql); /* run once on load to set initial state */
})();

/* ── SERVICE CARD TAP STATE (iOS Safari :hover fix) ────────── */
(function () {
  /* Only needed on touch devices — desktop :hover works fine */
  if (!window.matchMedia('(pointer: coarse)').matches) return;

  const svcs = [...document.querySelectorAll('.svc')];

  svcs.forEach(svc => {
    svc.addEventListener('click', () => {
      const wasActive = svc.classList.contains('svc-active');
      /* Collapse any previously active card */
      svcs.forEach(s => s.classList.remove('svc-active'));
      /* Toggle the tapped card */
      if (!wasActive) svc.classList.add('svc-active');
    });
  });
})();

/* ── MOBILE PLAYER CARD SHEET ──────────────────────────────── */
(function () {
  const MQL    = window.matchMedia('(max-width: 767px)');
  const sheet  = document.getElementById('player-sheet');
  if (!sheet) return;

  const backdrop   = document.getElementById('player-sheet-backdrop');
  const panel      = sheet.querySelector('.player-sheet-panel');
  const closeBtn   = document.getElementById('sheet-close');
  const handle     = sheet.querySelector('.sheet-handle');
  const sheetPhoto = document.getElementById('sheet-photo');
  const sheetBody  = document.getElementById('sheet-body');
  const cards      = [...document.querySelectorAll('.pcard')];

  let activeCard   = null;
  let closeTimer   = null;
  const reducedMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CLOSE_DELAY    = reducedMotion ? 20 : 230;
  const DISMISS_THRESHOLD = 120; // px of downward drag needed to dismiss

  /* ── ARIA attrs (mobile only) ─────────────────────────────── */
  function setCardAttrs(on) {
    cards.forEach(card => {
      if (on) {
        const nameEl = card.querySelector('.pcard-body .pcard-name');
        card.setAttribute('role',          'button');
        card.setAttribute('tabindex',      '0');
        card.setAttribute('aria-haspopup', 'dialog');
        card.setAttribute('aria-expanded', 'false');
        if (nameEl) card.setAttribute('aria-label',
          'View details for ' + nameEl.textContent.trim());
      } else {
        ['role','tabindex','aria-haspopup','aria-expanded','aria-label']
          .forEach(a => card.removeAttribute(a));
      }
    });
  }

  /* ── Populate sheet from a card ──────────────────────────── */
  function populate(card) {
    const photoInner = card.querySelector('.pcard-photo-inner');
    sheetPhoto.innerHTML = '';
    if (photoInner && photoInner.classList.contains('pcard-photo-placeholder')) {
      const ph = document.createElement('div');
      ph.className = 'sheet-photo-placeholder';
      ph.innerHTML = photoInner.innerHTML;
      sheetPhoto.appendChild(ph);
    } else if (photoInner) {
      const inner = document.createElement('div');
      inner.className = 'sheet-photo-inner';
      inner.style.backgroundImage = photoInner.style.backgroundImage;
      sheetPhoto.appendChild(inner);
    }
    const body = card.querySelector('.pcard-body');
    sheetBody.innerHTML = body ? body.innerHTML : '';
    const nameInSheet = sheetBody.querySelector('.pcard-name');
    if (nameInSheet) nameInSheet.id = 'sheet-player-name';
  }

  /* ── Clear any inline drag styles ───────────────────────── */
  function resetDragStyles() {
    panel.style.transform     = '';
    panel.style.transition    = '';
    backdrop.style.opacity    = '';
    backdrop.style.transition = '';
  }

  /* ── Open ────────────────────────────────────────────────── */
  function openSheet(card) {
    clearTimeout(closeTimer);
    resetDragStyles();
    sheet.classList.remove('closing');

    activeCard = card;
    populate(card);

    card.setAttribute('aria-expanded', 'true');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.classList.add('open');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn.focus());
  }

  /* ── Close (button / backdrop / Esc) ─────────────────────── */
  function closeSheet() {
    if (!activeCard) return;
    const card = activeCard;

    resetDragStyles();            // clear any mid-drag inline position
    sheet.classList.add('closing');
    sheet.classList.remove('open');

    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      sheet.classList.remove('closing');
      sheet.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      activeCard = null;
      card.setAttribute('aria-expanded', 'false');
      card.focus();
    }, CLOSE_DELAY);
  }

  /* ── Drag-to-dismiss on handle area ─────────────────────── */
  let isDragging   = false;
  let dragStartY   = 0;
  let dragCurrentY = 0;

  // Accept drag from the top 64 px of the panel (covers handle + close btn row)
  panel.addEventListener('touchstart', e => {
    if (!sheet.classList.contains('open')) return;
    const fromTop = e.touches[0].clientY - panel.getBoundingClientRect().top;
    if (fromTop > 64) return;
    isDragging   = true;
    dragStartY   = e.touches[0].clientY;
    dragCurrentY = 0;
    panel.style.transition    = 'none';
    backdrop.style.transition = 'none';
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!isDragging) return;
    e.preventDefault();
    const deltaY = Math.max(0, e.touches[0].clientY - dragStartY);
    dragCurrentY = deltaY;
    panel.style.transform  = `translateY(${deltaY}px)`;
    // Fade the backdrop in proportion to how far the panel has been dragged
    backdrop.style.opacity = String(Math.max(0, 1 - deltaY / (panel.offsetHeight * 0.55)));
  }, { passive: false });

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    if (dragCurrentY >= DISMISS_THRESHOLD) {
      /* Crossed threshold — continue sliding down from current position */
      const card = activeCard;
      sheet.classList.add('closing');   /* blocks taps + keeps visibility during slide-out */
      panel.style.transition    = 'transform 200ms ease-in';
      backdrop.style.transition = 'opacity 200ms ease-in';
      panel.style.transform     = 'translateY(100%)';
      backdrop.style.opacity    = '0';
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        resetDragStyles();
        sheet.classList.remove('open', 'closing');
        sheet.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        activeCard = null;
        if (card) { card.setAttribute('aria-expanded', 'false'); card.focus(); }
      }, 200);
    } else {
      /* Below threshold — snap back open */
      panel.style.transition    = 'transform 320ms cubic-bezier(.16,1,.3,1)';
      backdrop.style.transition = 'opacity 320ms ease-out';
      panel.style.transform     = 'translateY(0)';
      backdrop.style.opacity    = '1';
      clearTimeout(closeTimer);
      closeTimer = setTimeout(resetDragStyles, 320);
    }
  }

  document.addEventListener('touchend',    onDragEnd);
  document.addEventListener('touchcancel', onDragEnd);

  /* ── Card interactions ───────────────────────────────────── */
  cards.forEach(card => {
    card.addEventListener('click', () => { if (MQL.matches) openSheet(card); });
    card.addEventListener('keydown', e => {
      if (!MQL.matches) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet(card); }
    });
  });

  closeBtn.addEventListener('click', closeSheet);
  backdrop.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheet.classList.contains('open')) closeSheet();
  });

  /* ── Focus trap ──────────────────────────────────────────── */
  sheet.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !sheet.classList.contains('open')) return;
    const focusable = [...sheet.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (focusable.length < 2) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first)
      { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last)
      { e.preventDefault(); first.focus(); }
  });

  /* ── Viewport resize ─────────────────────────────────────── */
  MQL.addEventListener('change', e => {
    setCardAttrs(e.matches);
    if (!e.matches && activeCard) {
      clearTimeout(closeTimer);
      resetDragStyles();
      sheet.classList.remove('open', 'closing');
      sheet.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      activeCard.setAttribute('aria-expanded', 'false');
      activeCard = null;
    }
  });

  /* ── Init ────────────────────────────────────────────────── */
  setCardAttrs(MQL.matches);
})();
