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

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  (function lerp() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(lerp);
  })();

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
  if (!hamburger || !drawer) return;

  function open() {
    hamburger.classList.add('open');
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    hamburger.classList.remove('open');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? close() : open();
  });
  overlay.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
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

/* ── PROCESS TABS ──────────────────────────────────────────── */
(function () {
  const tabs   = document.querySelectorAll('.process-tab');
  const panels = document.querySelectorAll('.process-panel');
  if (!tabs.length) return;

  function activate(index) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    panels.forEach((panel, i) => {
      panel.classList.toggle('hidden', i !== index);
    });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click',      () => activate(i));
    tab.addEventListener('mouseenter', () => activate(i));
  });
})();

/* ── STAT COUNTERS ─────────────────────────────────────────── */
(function () {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el       = entry.target;
      const end      = parseInt(el.dataset.end, 10);
      const duration = 1800;
      const start    = performance.now();

      function tick(now) {
        const t      = Math.min(1, (now - start) / duration);
        const eased  = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(end * eased);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });

  counters.forEach((c) => io.observe(c));
})();

/* ── HERO PLAYER PARALLAX (desktop only) ───────────────────── */
(function () {
  const player = document.getElementById('hero-player');
  if (!player) return;
  if (window.matchMedia('(max-width: 880px)').matches) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    player.style.transform =
      `translate3d(${y * 0.05}px, ${y * 0.15}px, 0) scale(${1 + y * 0.0003})`;
  }, { passive: true });
})();
