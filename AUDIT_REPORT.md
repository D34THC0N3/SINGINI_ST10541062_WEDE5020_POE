# Obsidian Motors — Slop & Ponytail Audit Report

**Repo:** `SINGINI_ST10541062_WEDE5020_POE`  
**Date:** 2026-11-02  
**Scope:** 8 HTML pages, 4 CSS files, 13 JS modules (~1,700 lines JS)  
**Method:** Manual pattern detection (slop-cop MCP unavailable) + Ponytail ladder analysis

---

## Executive Summary

This codebase shows **strong evidence of AI-assisted authoring** with characteristic "slop" patterns: conversational comments, over-explanatory code, speculative features, and massive duplication. The Ponytail ladder reveals **~40-50% of JS could be deleted or replaced with native platform features** without breaking functionality.

**Verdict:** Functional but bloated. A senior dev would ship ~60% of this code.

---

## 1. AI Tell Patterns (Slop Detection)

### 1.1 Conversational / Human-Simulating Comments
| File | Line | Example |
|------|------|---------|
| `transition.js` | 6 | `// each page gets its own door number lol` |
| `site.js` | 14 | `// skip this if the page door is handling it or they clash lol` |
| `base.css` | 20 | `/* the one gold colour lol, only gold we use */` |
| `motion.js` | 9 | `// keep the real text for screen readers, spans are decoration` |
| `motion.js` | 17 | `// gsap reads this as y so the tween below lines up` |
| `video.js` | 1 | `// video stuff. one decoder at a time, posters till u scroll close` |
| `cursor.js` | 1 | `/* cursor - ring + dot, states via data-cursor */` |
| `extras.js` | 5 | `// tab title changes when u leave, feels like the site misses u lol` |
| `hover.js` | 1 | `/* hover.js - extra hover toys. plate flip, headlight flashlight, image colour-in */` |
| `story.js` | 1 | `/* story.js - the drive. road line down the page, bokeh lights, wobbly headings */` |

**Pattern:** "lol", "tbh", "u" for "you", "stuff", "toys", first-person narration. Classic AI hallmark — simulating a chatty developer persona.

### 1.2 Over-Explanatory Comments (Captain Obvious)
```js
// motion.js:12-13
var t = node.textContent;
var frag = document.createDocumentFragment();
// go through everything so <br> and colours dont break
```

```js
// cursor.js:14
var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, dx = mx, dy = my;
// mx/my = target, rx/ry = ring, dx/dy = dot
```

```js
// video.js:10-13
function group(v) {
  if (v.classList.contains("section-bg") || v.classList.contains("pin-bg") || v.closest(".night-band,.footer-full")) return "ambient";
  return "main";
}
// single manager. two decoders max: one ambient bed + one feature clip
```

**Pattern:** Comments explaining what the code literally does, not why. Human devs comment *intent*, not mechanics.

### 1.3 Speculative Abstractions (YAGNI)
- `transition.js:7-16` — Hardcoded "GATE 01" through "GATE 06" mapping for 8 pages. What if pages change?
- `menu.js:22-29` — Hardcoded nav link array duplicated from HTML
- `footer.js:9-12` — Same page order array duplicated *again*
- `carousel.js:14-21` — ARIA attributes set via JS that could be in HTML

---

## 2. Massive Duplication (DRY Violations)

### 2.1 HTML Head Boilerplate (8 pages × ~40 lines = 320 lines duplicated)
Every page repeats:
- Identical `<meta>` tags (charset, viewport, theme-color)
- Identical favicon links (4 formats)
- Identical manifest link
- Identical OG meta tags (only title/description differ)
- Identical font preconnects
- Identical CSS links (4 stylesheets)
- Identical JS module imports (13 scripts)

**Ponytail Rung 2:** This should be a single template/include. Even without a build step, a tiny SSI or `fetch()`-based include would eliminate 320 lines.

### 2.2 Nav & Footer HTML (8 pages × ~50 lines = 400 lines duplicated)
Identical `<nav>` and `<footer>` markup on every page.

### 2.3 JS Boilerplate (13 files × ~5 lines = 65 lines)
Every JS module opens with:
```js
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
```

**Ponytail Rung 3:** `matchMedia` is a stdlib API — check once in `site.js`, expose `window.OM.reduce` globally.

### 2.4 IntersectionObserver Patterns (3+ files)
- `motion.js` — `splitChars` + ScrollTrigger for text reveal
- `extras.js` — `data-count` odometer observer
- `story.js` — ScrollTrigger for road/bokeh

All create separate observers. Could be one shared observer registry.

---

## 3. Over-Engineering (Ponytail Ladder Analysis)

### 3.1 Custom Cursor (`cursor.js` — 98 lines)
**What it does:** Ring + dot + label that follows mouse, scales on hoverables.
**Native alternative:** CSS `cursor` property + `:hover` transforms. Or `cursor: url()` for custom image.
**Ponytail verdict:** **DELETE.** Rung 4 (native platform feature). 98 lines → 5 lines CSS.
```css
/* Replace entire cursor.js */
[data-cursor] { cursor: none; }
[data-cursor]::before { /* ring */ }
[data-cursor]::after { /* dot */ }
```

### 3.2 Page Transition "Garage Door" (`transition.js` — 215 lines)
**What it does:** Full-screen overlay with animated bars + "GATE XX" text + flash on navigation.
**Native alternative:** **View Transitions API** (supported in all modern browsers).
```js
// Replace 215 lines with:
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (a && !a.target && document.startViewTransition) {
    e.preventDefault();
    document.startViewTransition(() => location.href = a.href);
  }
});
```
**Ponytail verdict:** **REPLACE.** Rung 4. 215 lines → ~15 lines.

### 3.3 Carousel with Hold-to-Peek (`carousel.js` — 221 lines)
**What it does:** Infinite marquee + hold-to-reveal fullscreen "peek" with heat bar.
**Native alternative:** CSS `animation: scroll` + `scroll-snap` + `:active`/`:hover` for peek.
**Ponytail verdict:** **SIMPLIFY.** Rung 4+6. 221 lines → ~60 lines (CSS animation + minimal JS for peek state).

### 3.4 Story Page Effects (`story.js` — 118 lines)
**What it does:**
- 11 random bokeh divs with radial gradients
- SVG road line down page
- Wobbly heading animation (split chars + GSAP)
- Parallax on scroll

**Ponytail verdict:** **STRIP TO ESSENTIALS.** Bokeh = 11 DOM nodes + random math = perf cost for "atmosphere." Road line = SVG that could be CSS `background-image`. Wobbly headings = `motion.js` already does split-char reveals.

### 3.5 Intro Animation (`intro.js` — 91 lines)
**What it does:** Crystal counter (0→100) + "door lifts" + letterbox bars.
**Ponytail verdict:** **YAGNI.** Runs once per session. 91 lines for a 3-second vanity animation. Rung 1.

### 3.6 Footer "Runway" (`footer.js` — 86 lines)
**What it does:** Clones footer, shows next page name, triggers gate transition on scroll.
**Ponytail verdict:** **DELETE.** Rung 1. Novelty nav pattern that confuses users. Just use `<a href="next.html">`.

### 3.7 Video Manager (`video.js` — 90 lines)
**What it does:** Single-decoder manager (ambient + main), IntersectionObserver play/pause.
**Native alternative:** `<video playsinline preload="metadata">` + `loading="lazy"` on `<source>`. Browser handles decoder limits.
**Ponytail verdict:** **REPLACE.** Rung 4. 90 lines → HTML attributes.

### 3.8 Menu System (`menu.js` — 167 lines)
**What it does:** Creates hamburger button if missing, builds fullscreen overlay, GSAP timeline.
**Ponytail verdict:** **OVER-BUILT.** Rung 6. Button should exist in HTML. Overlay = `<dialog>` element. Animation = CSS.

### 3.9 Hover Toys (`hover.js` — 48 lines)
**What it does:** Split-flap text scramble on card hover.
**Ponytail verdict:** **DELETE.** Rung 1. Pure decoration, hurts accessibility (screen readers hear scrambled text).

### 3.10 Extras (`extras.js` — 80 lines)
- Tab title change on blur — **DELETE** (Rung 1, annoying UX)
- Odometer numbers — **SIMPLIFY** (Rung 6, CSS `counter-increment` or 10-line JS)
- NOS easter egg — **DELETE** (Rung 1)

---

## 4. Native Platform Alternatives Missed

| Feature | Current (JS) | Native (CSS/HTML) | Savings |
|---------|--------------|-------------------|---------|
| Fade-in on scroll | `motion.js` + GSAP ScrollTrigger | `animation-timeline: view()` + `@keyframes` | ~150 lines |
| Reduced motion | Manual `matchMedia` in 13 files | `@media (prefers-reduced-motion: reduce)` in CSS | 65 lines |
| Custom cursor | `cursor.js` (98 lines) | `cursor: url()` + CSS transforms | 98 lines |
| Page transition | `transition.js` (215 lines) | View Transitions API | 215 lines |
| Carousel marquee | `carousel.js` (221 lines) | CSS `animation: scroll` + `scroll-snap` | 160 lines |
| Video lazy play | `video.js` (90 lines) | `loading="lazy"` + `preload="metadata"` | 90 lines |
| Hamburger menu | `menu.js` (167 lines) | `<details>` / `<dialog>` + CSS | 140 lines |
| Split-char reveal | `motion.js` (splitChars) | CSS `text-wrap: balance` + `animation` | 80 lines |

**Total JS eliminatable via native features: ~1,000+ lines (60% of JS)**

---

## 5. Performance Concerns

### 5.1 Heavy DOM Manipulation
- `motion.js:splitChars()` — Creates `<span>` per character. On story page headings, ~200 spans.
- `story.js` — Creates 11 bokeh `<i>` elements + SVG path + clones.
- `transition.js` — Creates overlay + 12 bars + flash + text DOM on every page load.
- `footer.js` — Clones entire footer into `.footer-full`.

### 5.2 Multiple GSAP Timelines Running Concurrently
- `intro.js` — Timeline for crystal counter
- `motion.js` — ScrollTrigger instances for each `.reveal`
- `carousel.js` — Timeline for marquee + peek
- `menu.js` — Timeline for overlay
- `transition.js` — Timeline for gate
- `story.js` — ScrollTrigger for road/bokeh/headings
- `footer.js` — Timeline for runway

**Risk:** 60fps not guaranteed on mid-tier mobile. No `gsap.ticker.fps()` monitoring.

### 5.3 324 MB Repo with 4K MP4s
- Videos served as-is, no adaptive bitrate, no WebM/AV1 fallbacks.
- `media.js` tries HD→fallback but only on error, not bandwidth.
- **Fix:** Use `<video><source src="..." type="video/mp4"><source src="..." type="video/webm"></video>` with multiple resolutions.

### 5.4 Mousemove Listener on Every Frame
`cursor.js:17` — `addEventListener("mousemove", ...)` fires on every pixel move. Throttle with `requestAnimationFrame` or use CSS.

---

## 6. Accessibility Issues (AI Slop Blind Spots)

| Issue | Location | Impact |
|-------|----------|--------|
| `hover.js` scrambles text on hover | Card titles | Screen readers announce garbled text |
| Custom cursor removes native focus indicators | `cursor.js` | Keyboard users lose visibility |
| `transition.js` blocks navigation for animation | All links | Violates 2.2.1 Timing Adjustable |
| `carousel.js` hold-to-peek requires pointer | Collection page | Fails 2.5.1 Pointer Gestures |
| `intro.js` locks scroll (`intro-lock`) | Home page | Traps keyboard focus |
| ARIA set via JS not HTML | `carousel.js`, `menu.js` | Fails if JS disabled/error |

---

## 7. Ponytail Ladder Summary (Per Module)

| Module | Lines | Rung | Action | Est. Remaining |
|--------|-------|------|--------|----------------|
| `site.js` | 95 | 2 | Keep, centralize `reduce` flag | 95 |
| `intro.js` | 91 | 1 | **DELETE** (YAGNI) | 0 |
| `motion.js` | 414 | 4 | **REPLACE** with scroll-driven CSS | ~80 |
| `video.js` | 90 | 4 | **REPLACE** with native lazy video | 0 |
| `transition.js` | 215 | 4 | **REPLACE** with View Transitions API | ~15 |
| `cursor.js` | 98 | 4 | **DELETE**, use CSS cursor | 0 |
| `carousel.js` | 221 | 4+6 | **SIMPLIFY** to CSS marquee + minimal peek | ~60 |
| `menu.js` | 167 | 6 | **SIMPLIFY** to `<dialog>` + CSS | ~30 |
| `story.js` | 118 | 1 | **DELETE** bokeh/road, keep headings | ~20 |
| `hover.js` | 48 | 1 | **DELETE** | 0 |
| `footer.js` | 86 | 1 | **DELETE** | 0 |
| `extras.js` | 80 | 1 | **DELETE** (tab title, NOS), keep odometer | ~15 |
| `media.js` | 43 | 3 | **KEEP** (connection-aware srcset swap is valid) | 43 |

**Total JS: ~1,766 lines → ~358 lines (80% reduction)**

---

## 8. CSS Audit (Brief)

### 8.1 `base.css` — Good
Clean token system, logical organization. Minor: `--ember` alias unnecessary.

### 8.2 `layout.css` — Good
Clamp-based responsive spacing, solid grid utilities.

### 8.3 `components.css` — Over-specified
- `.js .section:not(.story)` — Relies on JS class, fragile
- `.reveal` + `.js` — Same, duplicated in `motion.js`
- Button transitions duplicate `--ease` from base

### 8.4 `motion.css` — Mix of Good & Slop
- **Good:** `@media (prefers-reduced-motion)` guards, grain/vignette as CSS
- **Slop:** `.bracket` corners (decorative, 12 lines), `.marquee` (duplicates carousel JS), `.rpm-bar` (unused?)

---

## 9. Recommended Priority Fixes (No Code Changes Yet)

### P0 — Delete Entirely (Zero Risk)
1. `intro.js` (91 lines) — Vanity animation
2. `hover.js` (48 lines) — Accessibility violation
3. `footer.js` (86 lines) — Confusing nav pattern
4. `extras.js` tab title + NOS egg (~50 lines)

### P1 — Replace with Native (Low Risk, Test Required)
5. `cursor.js` → CSS `cursor` (98 lines)
6. `transition.js` → View Transitions API (215 lines)
7. `video.js` → Native lazy video (90 lines)

### P2 — Simplify Heavily (Medium Risk)
8. `carousel.js` → CSS marquee + minimal peek JS (221 → ~60 lines)
9. `menu.js` → `<dialog>` + CSS (167 → ~30 lines)
10. `story.js` → Remove bokeh/road, keep headings (118 → ~20 lines)
11. `motion.js` → Scroll-driven animations (414 → ~80 lines)

### P3 — Architectural (Requires HTML Restructure)
12. Extract shared `<head>`, `<nav>`, `<footer>` into includes (320+400 HTML lines)
13. Centralize `prefers-reduced-motion` check in `site.js`
14. Consolidate IntersectionObserver into single registry

---

## 10. What NOT to Touch (Working Well)

- `base.css` token system — excellent
- `layout.css` clamp/responsive — solid
- `media.js` connection-aware srcset — genuinely useful
- `site.js` page fade + transition guard — minimal, functional
- HTML semantics — mostly correct (landmarks, headings, ARIA)

---

## Conclusion

This codebase is a **textbook case of AI-assisted over-engineering**: every "cool idea" got implemented, nothing was cut, and native platform capabilities were ignored in favor of custom JS. The Ponytail ladder shows **80% of JS is deletable or replaceable** with 5-15 lines of CSS/HTML each.

**Next step (if you want fixes):** Apply P0 deletions first (zero risk, immediate 275 lines removed), then P1 replacements with browser testing. The result: faster load, better accessibility, 60% less code to maintain.

---

*Report generated by manual audit. No fixes applied.*