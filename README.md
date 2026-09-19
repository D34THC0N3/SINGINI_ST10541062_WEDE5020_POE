# Obsidian Motors — WEDE5020 POE Part 2 (images + video, no 3D)

A dark, cinematic private-collection site for ultra-rare cars — now **images + video only** (showcase/3D removed for time). Obsidian/onyx palette, Fraunces + Inter + IBM Plex Mono, garage-at-night mood.

Live premise: **Obsidian Motors** sources, verifies and quietly places the world's rarest cars from **Rosebank International, Pretoria** (WEDE5020 / ST10541062 / fictional brand for coursework).

## Pages (7 + 404)

| Page | What it is |
|------|------------|
| `index.html` | Hero (static high-fidelity still) + provenance + current inventory (3 cards → collection) |
| `collection.html` | Vault: 4 dossiers (M3 GTR #15, AMG GT3 #14, McLaren F1 #13, Fenomeno #12) — photography cards → contact |
| `about.html` | How we source (private acquisitions · Dubai recovery) |
| `consign.html` / `contact.html` | Consignment + enquiry forms (client-side validation) |
| `privacy.html` / `terms.html` / `404.html` | Legal + styled 404 |

> `showcase.html` and all `js/three-*`, `js/showcase*`, `js/scroll-story*` were removed — the site now ships no Three.js, no GLB/HDR, no canvas.

## How to run

No build step. Any static server works; `file://` also works now that there are no GLBs:

```powershell
# from the repo root
python -m http.server 8000
# then http://localhost:8000  (or http://127.0.0.1:8000 if localhost flakes)
```

VS Code "Live Server" works the same way.

## Stack

- Pure **HTML + CSS + JS** — no bundler (school constraint).
- Fonts: **Fraunces** (display serif), **Inter** (body), **IBM Plex Mono** (HUD/mono) via Google Fonts.
- JS: `js/site.js` only — scroll dots, reveal-on-scroll, nav, intro-once-per-tab, page fade, counters. No importmap, no Three.js, no GSAP required.

## Project layout

```
index.html  collection.html  about.html  consign.html  contact.html  privacy.html  terms.html  404.html
css/
  base.css        # tokens, reset, type, atmosphere
  layout.css      # nav, sections, hero, footer, 404, responsive
  components.css  # buttons, cards, panels, forms, reveal, media plates
  pages/          # reserved (empty)
js/
  site.js         # scroll dots, reveal, nav, intro, page fade, counters
assets/
  images/  alpine-garage.jpg  amg-gt3.jpg  gt2rs.jpg  zonda-f.jpg  mclaren-knightsbridge.jpg  etc.
  icons/   favicon.svg  (obsidian crystal)
  models/  *.glb + env/garage.hdr  # kept in repo but NOT loaded by any page (archive)
site.webmanifest
```

## Design direction

- **Mood:** cinematic, dark, serious, luxurious — underground garage at night.
- **Palette:** obsidian / carbon blacks + warm bone (`#ede8e0`), one muted gold `#b8976a`. No neon, no purple-blue gradients, no glassmorphism.
- **Type:** Fraunces (display) / Inter (body) / IBM Plex Mono (HUD).
- **Accents:** mono HUD ticks, Blacklist `#15…#12` badges, garage-door bay rules, rpm tick strip — subtle NFS Most Wanted 2005 nods.

`prefers-reduced-motion` is honoured (reveal animations collapse to instant, intro skips).

## Forms and validation

`contact.html` and `consign.html` use `novalidate` + lightweight `site.js` validation: required fields show an inline mono hint, successful submit shows the `data-ok` note (no backend — the demo stops there).

## Media

Current pages use `assets/images/*.jpg` photography. Any future missing hero/poster: generate via **9router-image** (hyper-real 21:9) → `fal-ai-media`/`higgsfield` video if motion needed → Pexels/Unsplash fallback. Never a grey box. If you re-enable 3D later, the archived `assets/models/*.glb` + `assets/env/garage.hdr` pipeline is documented in git history (`1a09e83`).

## References

- Mood refs: `iY8Nz_hAdh0`, `3jLEtgAuIMo`, `p7DbgxJkaaw` (kept as inspiration, not implemented as 3D)
- Dark site study: `exp-gemini.lusion.co` (local clone at `C:\Users\junio\Desktop\EXP\WEBSITE\exp-gemini.lusion.co`) — spatial/layout inspiration only
- Code ref: `Footprintarts/3D_LandingPage` (archived)

## Changelog

- **Part 1:** initial static site with `site.css` + `model-viewer`.
- **Part 2 — P2/P3:** built `three-engine.js` + scroll-story + showroom (PMREM HDRI, Draco, Lusion-spatial). Archived in git.
- **Part 2 — P4 (current):** **removed showcase + all 3D** (showcase.html, three-engine.js, showcase3d.js, scroll-story.js, importmaps, canvases). Hero is now static high-fidelity still, cards link to `collection.html`/`contact.html`, nav/footers stripped of Showcase, `Johannesburg` → `Rosebank International, Pretoria` (0 hits), 7 routes + 404 verified, single-hue palette, hero copy tightened.
