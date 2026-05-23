# Intrepid Hockey — Code, UI/UX, Performance & Accessibility Audit

**Audited:** 2026-05-23
**Auditor:** Senior frontend engineer + UI/UX designer review
**Scope:** Live static site in `intrepidhockey/` — `index.html`, `privacy-policy.html`, `thank-you.html`, `style.css` (2,453 lines), `main.js` (682 lines)
**Method:** Full read of all source files + asset inventory + manual WCAG contrast math. No code changed in this pass.

---

## Executive summary

This is a genuinely well-built hand-coded static site — the semantic HTML, ARIA patterns (the player sheet modal and process tablist are textbook-correct), design-token system, self-hosted fonts, and `prefers-reduced-motion` support are all well above average for a marketing site with no framework or build step. The most urgent problems are **content/legal**, not engineering: a Slovak placeholder watermark ("Takto sa odfotiť") is shipped visibly across the founder photo, the Privacy Policy is missing the legally required data-controller identity while the site collects minors' personal data, the two family testimonials are explicitly placeholder text, and the Privacy Policy page still loads Google Fonts from a CDN — directly contradicting its own "no third-party" statement. Beyond those, the biggest engineering risks are a progressive-enhancement gap (all `.reveal` content is `opacity:0` until JS runs, so a JS failure blanks the page), one whole section failing color contrast (white on `--teal-400` ≈ 2.9:1), and ~11 MB of unoptimized PNGs including a stray 4.9 MB file.

Total findings: **28** — 🔴 4 Critical · 🟠 6 High · 🟡 10 Medium · 🔵 8 Low

---

## What's working well (do not change)

- **Semantic structure.** One `<h1>`, logical `h2`/`h3` hierarchy, real landmarks (`<header>`/`<nav>`/`<main>`/`<footer>`), every `<section>` labelled with `aria-labelledby`. This is done correctly throughout `index.html`.
- **The player-detail sheet** (`main.js` 472–681) is exemplary: focus trap, `Esc` to close, focus returned to the triggering card, `aria-modal`, drag-to-dismiss, and reduced-motion-aware timings. Don't touch it.
- **The process tablist** (`main.js` 96–206) implements the full WAI-ARIA tabs keyboard pattern — arrow keys, Home/End, roving `tabindex`, `aria-selected`. Correct.
- **Design tokens.** A complete teal (50–900) and neutral (50–900) scale in `:root` (`style.css` 43–73). Colors are largely centralized.
- **Self-hosted fonts with `font-display: swap`** on every `@font-face` (index/thank-you). Good for privacy and FOUT behavior.
- **`prefers-reduced-motion`** is respected globally (`style.css` 2444–2453) — animations and reveals are neutralized.
- **Form fundamentals.** Correct input types (`email`/`tel`/`url`/`number`), `inputmode="numeric"` on birth year, 16px input font (avoids iOS zoom), every input has a real `<label>`, `required` + `aria-required`, GDPR consent gating, and native validation restored.
- **SEO baseline on `index.html`** — unique title/description, Open Graph + Twitter cards, canonical, favicons, and Organization JSON-LD.
- **Passive scroll listeners**, `requestAnimationFrame` for the cursor and counters, and well-scoped IIFEs with consistent null-guards. No global scope pollution.

---

## Findings by priority

### 🔴 Critical (fix before launch)

**C1 · [Content] Placeholder watermark shipped across the founder photo** — `index.html:580`, `style.css:1671–1689`
The element `<div class="founder-photo-wm">Takto sa odfotiť</div>` renders large rotated text ("Take a photo like this" in Slovak) overlaid on the founder photo at `rgba(255,255,255,0.55)`. This is an internal note-to-self displayed on the live page, defacing the single most trust-critical image on the site. It is also not `aria-hidden`, so screen readers announce it. **Fix:** remove the element (and its CSS) once the real photo is in place, or hide it. Highest-visibility production defect.

**C2 · [Legal/GDPR] Privacy Policy is missing the data controller identity** — `privacy-policy.html` §1 (≈ lines 182–184)
Three `TODO` placeholders remain: legal company name, registered address, and IČO (company registration number). The site actively collects personal data of **minors** (player name, birth year, team) plus parent contact details. GDPR Art. 13 requires the controller be identified. Shipping the form live with an unidentifiable controller is a legal exposure. **Fix:** fill in the legal entity details before the form goes live.

**C3 · [Trust/Legal] Family testimonials are placeholder text presented as real** — `index.html:383–439`
A `<!-- TODO: Replace placeholder quotes and credentials with real testimonials -->` precedes two fabricated, attributed quotes ("Martin K.", "Eva and Peter N.") with specific claims (AAA Ontario, Junior A USA). Publishing invented testimonials to families is a deceptive-advertising risk and a trust landmine if discovered. **Fix:** replace with real, consented testimonials or remove the section until you have them. (Judgment call on severity, but for a service selling to parents this is launch-blocking.)

**C4 · [Privacy] Privacy Policy page loads Google Fonts from a CDN — contradicting its own text** — `privacy-policy.html:8–10`
The page keeps `<link rel="preconnect" ...googleapis>` and a `fonts.googleapis.com/css2?...Barlow+Condensed...` stylesheet, while its own §8 states the site uses "only essential technical cookies … No third-party … tracking." Google Fonts logs the visitor's IP — a third-party data transfer, on the very page that denies it. It is also inconsistent: `index.html` and `thank-you.html` were migrated to self-hosted fonts; this page wasn't. **Fix:** delete lines 8–10; `style.css` already declares self-hosted Barlow Condensed.

---

### 🟠 High

**H1 · [A11y/Contrast] Whole "Honest Path" section fails AA** — `style.css:1271` (bg `--teal-400` `#00a8b3`) vs `1314`/`1304` (white text)
White (and `rgba(255,255,255,0.92)`) body text on `#00a8b3` measures **≈ 2.9:1** — fails AA for normal text (4.5:1) and is marginal even for the large heading (3:1). The body copy (`clamp(16–19px)`) is the real failure. **Fix:** darken the section background to `--teal-600` (`#006D75`, ≈ 6.1:1 with white) or darken the text. Affects an entire content section.

**H2 · [Robustness] Content is invisible if JavaScript fails** — `style.css:2358–2370`, `main.js:79–94`
Every `.reveal` / `.reveal-stagger` element starts at `opacity:0` and only becomes visible when the IntersectionObserver adds `.in`. There is no `<noscript>` fallback. If `main.js` fails to load/parse (CDN hiccup, blocked script, old browser), the hero subline, every section heading, the services, players, founder, CTA, and **the entire evaluation form** stay invisible. Compounded by `body { cursor: none }` (`style.css:90`) which hides the desktop cursor with no replacement when the cursor JS doesn't run. **Fix:** make reveals additive (visible by default, JS adds the transition) or add `<noscript><style>.reveal,.reveal-stagger>*{opacity:1;transform:none}</style></noscript>` and a `cursor:auto` fallback. Progressive-enhancement is currently violated for core content.

**H3 · [Performance] Hero LCP image is a 617 KB PNG; no modern formats anywhere** — `index.html:55,189`; assets
`player-teal.png` (617 KB) is `<link rel="preload" as="image">`'d and is the likely LCP element. All photographic/illustrative assets are PNG/JPG — no WebP/AVIF. `player-teal.png` alone as WebP would likely drop to ~80–120 KB. **Fix:** convert hero + player + service images to WebP (with PNG fallback via `<picture>` if needed). Biggest single LCP win.

**H4 · [Performance/Repo] A 4.9 MB image ships in the deployed folder** — `assets/logo-narrow-original-4mb.png`
This 4,883 KB file is not referenced by any page (the nav uses `logo-narrow.png`, 13 KB) but sits in the deployed `assets/` directory and is committed to git. It's pure dead weight that anyone can fetch. **Fix:** delete it from the repo (keep originals outside the deploy folder). `gameplan.png` (1.98 MB), used only as an 8–30% opacity decorative background (`style.css:828–838`), is similarly oversized — recompress to a few hundred KB.

**H5 · [A11y/Contrast] Muted metadata text on white fails AA** — `style.css:1787` (`.cta-attr`), `1666` (`.founder-caption`)
`--neutral-400` `#999999` on white measures **≈ 2.85:1** — fails both 4.5:1 and 3:1. Affects the CTA date line ("June 7, 2003 · Game Six · Stanley Cup Final", 13px) and the founder caption (12px italic). **Fix:** use `--neutral-600` (`#555`, ≈ 7.5:1) or darker for these.

**H6 · [A11y] Mobile nav drawer has no focus management** — `main.js:40–77`
Unlike the player sheet, the drawer doesn't move focus into itself on open, doesn't trap focus (Tab escapes to the page behind the overlay), and doesn't return focus to the hamburger on close. Keyboard/screen-reader users can tab into hidden background content. **Fix:** mirror the sheet's focus handling — focus first link on open, trap Tab, restore focus on close.

---

### 🟡 Medium

**M1 · [Maintainability] Dead code across JS and CSS**
- Stat-counter IIFE `main.js:311–336` — no `.counter`/`data-end` element exists in any HTML. Entirely dead.
- Marquee CSS `style.css:726–750` + `--marquee-duration` token (`72`) — the marquee was removed from HTML. Dead.
- `.mf-arrow` / `.mf-dot` + `drawPath` keyframe `style.css:442,448–463` — no matching HTML in the hero manifesto. Dead.
- `@keyframes fadeIn` `style.css:387` — defined, never referenced. Dead.
- `.endorse-qmark` `style.css:2220–2229` — no matching element. Dead.
**Fix:** delete. ~80+ lines of dead CSS/JS.

**M2 · [CSS] Inconsistent breakpoint system** — 10 distinct values used: 1024, 1023, 980, 880, 768, 767, 720, 640, 600, 540. Some pairs are nearly identical and ad hoc (`1023` vs `1024`, `600` vs `640`). The `767/768` split is intentional (sheet vs accordion), but the rest reads as accreted rather than designed. **Fix:** consolidate to ~4 named breakpoints; keep the deliberate 767/768 boundary.

**M3 · [A11y] No skip-to-content link** — keyboard users must tab through the entire nav on every page. **Fix:** add a visually-hidden `<a href="#main">` skip link as the first focusable element.

**M4 · [UX] No `scroll-padding-top` for the fixed nav** — `style.css:78,145`
`html` has `scroll-behavior:smooth` and the nav is `position:fixed` (~68px). Anchor jumps (`#services`, `#process`, etc.) align the target to `y=0`, so the fixed nav overlaps the top of each landed section. Generous section top-padding masks it in most cases, but it's fragile. **Fix:** `html { scroll-padding-top: 80px; }`.

**M5 · [A11y/UX] Form placeholder text is nearly invisible** — `style.css:1956–1957`
`rgba(255,255,255,0.2)` placeholders on the dark inputs measure ~1.7:1. Even though placeholders aren't strict content (labels exist), these examples ("e.g. Jakub") are practically unreadable. **Fix:** raise to ~`rgba(255,255,255,0.4)`.

**M6 · [A11y] Slovak text not marked `lang="sk"`** — `index.html:395,421` (native quotes), `580` (watermark). With `<html lang="en">`, screen readers mispronounce the Slovak strings. **Fix:** wrap Slovak phrases in `lang="sk"`.

**M7 · [Performance] `gameplan.png` (1.98 MB) used as faint decoration** — see H4; recompress.

**M8 · [Responsive] Possible hero headline overflow at ≤360px** — `style.css:435–441,721–724`
`.mf-line { white-space:nowrap }` with `font-size: clamp(34px,10vw,54px)` — "PATHWAYS" at 34px in Barlow Condensed Black may exceed the ~280px content width at 320px. `overflow-x:hidden` on body would clip rather than scroll, silently cutting the word. **Fix:** verify at 320–360px; allow wrapping or reduce the min clamp on the smallest screens. (Verify before treating as confirmed.)

**M9 · [A11y] Consent error not programmatically linked** — `index.html:742,745`
`#consent-error` has `aria-live="polite"` (good) but isn't tied to the checkbox via `aria-describedby`, and the error state is conveyed only by red color + appearance. **Fix:** add `aria-describedby="consent-error"` to the checkbox.

**M10 · [Housekeeping] Stray artifacts in the deploy folder**
- Two leftover editor temp files: `index.html.tmp.2832.2fa8980e60b1`, `index.html.tmp.2832.5672164eb639`.
- 18 `.ttf` originals remain in `fonts/` alongside the 32 `.woff2` actually used (CSS references only `.woff2`). ~50 font files / 2.95 MB in the folder.
**Fix:** delete temp files; move `.ttf` originals out of the deploy folder.

---

### 🔵 Low / nice-to-have

**L1 · [Contrast] `.hero-scroll` `--neutral-500` `#777` on white ≈ 4.48:1** (`style.css:684`) — fractionally under 4.5 for 11px text. Bump to `#6e6e6e` or darker.

**L2 · [Performance] Layout reads on every scroll** — `main.js:430` calls `getBoundingClientRect()` per scroll event (mobile back-to-top); `main.js:392–396` parallax writes transform per scroll without rAF batching. Minor jank potential on low-end phones. Throttle via rAF.

**L3 · [Performance] Cursor `requestAnimationFrame` loop runs forever** — `main.js:24–29` animates even when the mouse is idle. Negligible, but could pause when stationary.

**L4 · [Maintainability] Scattered inline styles** — `index.html:143,154,162–165` (animation-delays), `491,516,536` (background-image), `597`, `613`, `774`. Harder to maintain/CSP-harden. Move to CSS where practical.

**L5 · [A11y] Second `<nav>` lacks a distinct label** — the drawer `<nav>` (`index.html:89`) has no `aria-label`; with two navs, "Main navigation" is ambiguous. Add `aria-label="Mobile navigation"`.

**L6 · [A11y] Hamburger tap target is 40×40px** — `style.css:205–217` (< 44×44 recommended). Bump to 44.

**L7 · [SEO] `privacy-policy.html` lacks canonical/robots; no `sitemap.xml`/`robots.txt`** in the project. Add a canonical to the privacy page and a sitemap/robots for the site.

**L8 · [CSS] Hardcoded teal `rgba()` values** — e.g. `rgba(0,109,117,…)` (=teal-600) and `rgba(77,196,204,…)` (=teal-300) appear inline rather than via tokens (`style.css:134,307,400,520,915`…). Consider `rgb` tokens or `color-mix()` for single-source-of-truth. Low priority.

---

## Detailed findings by dimension

### A. HTML structure & semantics
Strong. Exactly one `<main>`, one `<h1>` (hero manifesto), correct `h2`/`h3` nesting, all sections `aria-labelledby`. Decorative SVGs and floats are `aria-hidden`. `<button>` vs `<a>` usage is correct (tabs/hamburger are buttons; nav/CTAs are anchors). Lists are real `<ul>`. `lang`, charset, viewport all present. **Issues:** founder watermark not hidden (C1); Slovak strings unlabelled (M6); second `<nav>` unlabelled (L5).

### B. Accessibility (WCAG 2.1 AA)
Measured contrast (sRGB, against the actual blended backgrounds):
| Combination | Where | Ratio | Verdict |
|---|---|---|---|
| `--teal-600` `#006D75` on white | accents, links, eyebrow | **6.1:1** | ✅ pass |
| `--teal-300` `#4dc4cc` on `--neutral-900` | process accents, specs | **9.1:1** | ✅ pass |
| `--neutral-600` `#555` on white | body copy | **7.5:1** | ✅ pass |
| white on `--teal-400` `#00a8b3` | **Honest Path section** | **≈2.9:1** | ❌ fail (H1) |
| `--neutral-400` `#999` on white | `.cta-attr`, `.founder-caption` | **≈2.85:1** | ❌ fail (H5) |
| `--neutral-500` `#777` on white | `.hero-scroll` | **≈4.48:1** | ⚠ marginal (L1) |
| placeholder `rgba(255,255,255,0.2)` | form inputs | **≈1.7:1** | ❌ (M5) |
| footer links `rgba(.9)` on teal-600 | footer | **≈5.0:1** | ✅ pass |

Keyboard/focus: global `:focus-visible` ring (good); player sheet focus-trap (excellent); **nav drawer has none (H6)**; no skip link (M3). `prefers-reduced-motion` fully handled. Touch targets mostly ≥44px (back-to-top 48, drawer links large); hamburger 40 (L6). Form: labels + `aria-required` good; `aria-describedby` missing on consent (M9).

### C. Responsive design & mobile UX
Layouts adapt well across the range; players grid 4→2→2, eval 2-col→1-col, process desktop-tabs→mobile-accordion is sophisticated. Inputs are 16px (no iOS zoom). `overflow-x:hidden` guards horizontal scroll but can silently clip (M8). Breakpoint sprawl (M2). Mobile nav opens/closes/scroll-locks correctly but lacks focus management (H6).

### D. Performance
**Assets total ≈ 11.4 MB** — dominated by `logo-narrow-original-4mb.png` (4.9 MB, unused, H4), `gameplan.png` (2.0 MB), `scott.png` (0.9 MB), `player-teal.png` (0.6 MB, preloaded LCP, H3). No WebP/AVIF anywhere. CSS ≈ 72 KB, JS ≈ 26 KB (both reasonable, single request each, render-blocking CSS is fine at this size). Fonts: 32 woff2 actually used with `swap` (good) but 18 ttf also in folder (M10). Scroll listeners are passive; minor per-scroll layout reads (L2). Reveal animations animate `opacity`/`transform` (composited — good). **CLS:** images mostly lack `width`/`height` except the logo — player/service/founder images could shift; consider `aspect-ratio` or dimensions. **LCP risk:** the 617 KB preloaded hero PNG (H3).

### E. UI / visual design quality (opinion, senior-designer lens)
Cohesive, confident editorial system — strong type scale, consistent teal/black/white discipline, good use of Barlow Condensed for display. Iconography is consistent (inline SVG, ~2.2 stroke). Hover/active states are present and considered. **Opinions:** the Honest Path teal (`--teal-400`) is the one off-discipline color — it's lighter than the `--teal-600` used elsewhere and is exactly what causes H1; standardizing on `--teal-600` would fix both the contrast and the palette inconsistency. The faint decorative service images (8% opacity) add little but cost 2 MB. Overall visual quality is high.

### F. UX / conversion / IA
Value proposition is clear within ~5 seconds (hero manifesto + subline). Section order builds logically: what we do → how → proof (players/testimonials/endorsement) → founder story → CTA → form. Nav labels are *brand-cute* ("The Plan / The Playbook / Pipeline / Connect") — on-brand but slightly less scannable than literal labels (opinion; acceptable). CTAs now resolve to a single primary "Start your evaluation" → in-page form (good, after this session's cleanup). **Form friction:** 8 required fields is on the heavier side for a first-touch lead form but justified for a consultative service. **Trust signals are the weak point** — placeholder testimonials (C3) and the defaced founder photo (C1) actively *undermine* trust right now; the Scott Harris endorsement is the strongest real signal.

### G. Code quality & maintainability
Clean IIFE architecture, no globals, cached DOM queries, consistent null-guards, helpful comments. CSS is component-organized with tokens. **Issues:** dead code (M1), one `!important` at `style.css:1146` (justified — overriding inherited SVG positioning; acceptable), hardcoded teal rgba (L8), scattered inline styles (L4), TODO/NOTE markers and placeholder copy shipped (C1–C3, plus the `<!-- NOTE: Replace "YOUR_FORM_ID" -->` comment at `index.html:641` which is now stale — a real Formspree ID is in place).

### H. SEO & metadata
`index.html` is strong: unique title/description, OG + Twitter, canonical, favicons, Organization JSON-LD. `thank-you.html` correctly `noindex`. **Gaps:** `privacy-policy.html` has no canonical/robots (L7); no `sitemap.xml`/`robots.txt` (L7); hero `<h1>` is brand-light for keywords (opinion — fine for UX).

### I. Cross-browser & robustness
`backdrop-filter`, `aspect-ratio`, flex `gap`, `100dvh`, `clamp()` are all used — all fine in current evergreen browsers, and `-webkit-` prefixes are present for `backdrop-filter`/`mask-image`. **Main robustness gap is JS-dependence (H2):** content hidden behind `.reveal` + `cursor:none` with no `<noscript>`. No `:has()` reliance. Feature detection via `matchMedia` is used appropriately.

### J. Security & privacy
External links (`eliteprospects`, `instagram`) correctly use `rel="noopener noreferrer"` + `target="_blank"`. No inline secrets/API keys (the Formspree endpoint is a public form ID — fine). Form posts over HTTPS to Formspree with a `_next` redirect to the thank-you page — fine. **Privacy issues:** Google Fonts on the privacy page (C4); the Privacy Policy itself is incomplete (C2). No unexpected trackers otherwise.

---

## Recommended fix sequence

1. **Content/legal launch-blockers (batch):** remove founder watermark (C1); fill Privacy Policy entity details (C2); replace/remove placeholder testimonials (C3); strip Google Fonts from the privacy page (C4). All small edits, highest impact.
2. **Robustness + contrast (batch):** add `<noscript>`/additive-reveal + `cursor:auto` fallback (H2); recolor Honest Path to `--teal-600` (H1, also fixes palette); darken `--neutral-400` metadata text (H5).
3. **Performance (batch):** delete the 4.9 MB stray PNG (H4); convert hero/player/service images to WebP and recompress `gameplan.png` (H3/M7).
4. **A11y polish (batch):** nav drawer focus management (H6); skip link (M3); `scroll-padding-top` (M4); placeholder contrast (M5); `lang="sk"` spans (M6); `aria-describedby` on consent (M9).
5. **Cleanup (batch):** delete dead CSS/JS (M1); remove temp files + ttf originals (M10); consolidate breakpoints (M2).
6. **Low / nice-to-have:** L1–L8 as time permits.

## Quick wins (high impact, <1 hour each)
- **Delete `logo-narrow-original-4mb.png`** from the repo — removes 4.9 MB instantly (H4).
- **Remove the founder watermark element** — one-line HTML deletion that fixes the worst visual defect (C1).
- **Strip the 3 Google Fonts `<link>`s from `privacy-policy.html`** — makes the privacy policy truthful and consistent (C4).
- **Recolor `.honest-path` background to `--teal-600`** — one value, fixes a full-section contrast failure (H1).
- **Add `html { scroll-padding-top: 80px }`** — one line, fixes nav-overlap on every anchor jump (M4).
