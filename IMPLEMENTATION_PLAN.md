# Obsidian Motors — POE Part 2 · Implementation Plan

**Purpose of this file:** a fresh agent (or a fresh session) must be able to execute
phases **P2 → P4** below, in order, with no extra context. Each phase ends with a
**STOP gate** — do not continue into the next phase until the gate is signed off.

Framework context: the site is a **no-build static site** (HTML + CSS + JS on CDN
importmaps, Three.js 0.167). That constraint is a school requirement — do not add
a bundler, a framework, or npm tooling to the shipped site.

> **Amendment 2026-09-19 — pressed for time:** `showcase.html` + `js/three-engine.js` + `js/showcase3d.js` + `js/scroll-story.js` **removed** (commit `d966b33`). Site now ships **images + video only**. Hero/grow videos are now sourced from `D:\New folder\Blender\Blender Reference videos` → copied to `assets/videos/hero.mp4` (Cycles X [d-QnAc_kSe0], 4.71 MB) + `grow.mp4` (Epic [8iyQqNKvPY0], 3.34 MB) + `nightcity.webm` (1.39 MB). If you re-enable showcase, restore from `cb0d921` and re-apply ponytail trim.

---

## 1. Audit (done — POE Part 1 code)

### 1.1 The renderers — why hero3d.js and showcase3d.js show nothing / too dark

Root cause is shared, which is why both pages look broken:

1. **Metallic paint with no environment map.** Both files traverse the loaded GLB and
   overwrite every mesh with `MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.92 })`.
   A metal-shaded surface reflects the *environment*, not lights. With `metalness` ~0.9
   and **no `scene.environment` (no HDRI/PMREM)** the car renders as a black silhouette
   sitting on a black ground against a `0x080808` background. It is "loading" — it's
   just painted with light-absorbing nothingness.
2. **No loader error handling.** `GLTFLoader.load(path, onLoad)` has no
   `onProgress`/`onError`. Any 404 / corrupt GLB leaves a silent, permanently black
   canvas. (The old `m3-gtr.glb` was geometry-only with zero materials.)
3. **Duplicated renderer/light/loader code.** hero3d.js and showcase3d.js each re-implement
   renderer setup, light rig, resize, paint override, ground, and centering logic —
   twice the surface area for the same bug. (Fix in P2 via one shared engine module.)
4. **Dead code.** `js/site.js` lines ~150–229 implement a whole `<model-viewer>`
   showcase controller; no page contains `#mv` anymore (guard makes it inert).
   CSS keeps dead `model-viewer`, `.mv-fallback`, `.sc-throttle`, `.sc-gauge` rules.
   (Remove in P4 ponytail pass.)
5. **Ground has no shadows/reflection** — `DirectionalLight`s never get
   `castShadow = true`, so the car visually floats.

### 1.2 Dead / duplicated CSS & piggy-backed cruft
- All `model-viewer` / `.mv-*` / `.sc-throttle` / `.sc-gauge` CSS (leftover from v1).
- `.hero-wheel` decorative rule is fine but coupled to `--p` scrub that P3 will replace.
- Palette is already obsidian/gold in code — the "neon gradient" feel the user hates
  comes from the *render output* (black canvas next to white text looks like a broken
  glow), plus `body::before` radial glows. P3 replaces with a stricter material system.

### 1.3 Content inventory issues
- Location text says **"Rosebank, Johannesburg"** in: `index.html` (×3 + title/meta),
  `about`, `collection`, `consign`, `contact`, `privacy`, `terms` footers, and the
  embedded Google Map iframe in `contact.html`. Target: **Rosebank International, Pretoria**.
- Footer is thin (3 columns, no hours/socials/small print) → P3 spec below.
- `README.md` still says **Part 1** → rewrite at P4.

---

## 2. Asset pipeline (done — re-run instructions)

**Deviation to note:** the Blender MCP addon was not connected (Blender not running),
so the pipeline ran **headless** via the installed Blender 4.5.3 LTS
(`blender.exe -b --python`) plus `@gltf-transform/cli`. Same outputs, reproducible.
Scripts live outside the repo at
`%LOCALAPPDATA%\Temp\opencode\obsidian-pipeline\convert.py`.

### 2.1 Converted this run

| Output (in repo)            | Source | Method | Size |
|-----------------------------|--------|--------|------|
| `assets/models/m3-gtr.glb`      | `D:\...\Quality\M3 GTR\model.obj` | Blender OBJ import → normalize to 4.6 m → Draco GLB | 1.35 MB |
| `assets/models/amg-gt3.glb`     | `...\mercedes-amg-gt3-evo-2020\...\2020_mercedes-amg_gt3_evo.glb` (49.5 MB) | `gltf-transform optimize --compress draco --texture-size 2048 --texture-compress webp` | 5.86 MB |
| `assets/models/mclaren-f1.glb`  | `...\mclaren-f1-gtr-longtail\...\mclaren-f1-gtr-longtail.glb` (14.7 MB) | same | 1.73 MB |
| `assets/models/fenomeno.glb`    | `...\lamborghini-fenomeno-2025\...\lamborghini_fenomeno_2025.glb` (38.3 MB) | same | 4.22 MB |
| `assets/models/garage.glb`      | `...\BUILDINGS\uploads_files_4478463_Underground+Garage+Scene.fbx` | Blender import → `make_single_user` → apply → scale to 60 m lot → GLB, then gltf-transform (draco + 1024px webp) | 1.77 MB |
| `assets/env/garage.hdr`         | `...\HDRI\cobblestone_street_night_2k.hdr` | Blender load → scale to 1024 px wide → save `.hdr` | 1.76 MB |

Budget check: every GLB ≤ 8 MB. ✔

### 2.2 Conversion decisions (why, and how to re-run)
- **Reused existing GLBs where they exist** (vecarz packs ship them) instead of
  re-exporting 190 MB .blend files — same geometry, ~10× faster, textures intact.
- **Draco + WebP** — Three.js 0.167 GLTFLoader supports both
  (`KHR_draco_mesh_compression`, `EXT_texture_webp`). Decoders must be pointed at the
  CDN in P2: `examples/jsm/libs/draco/gltf/` on jsdelivr.
- **M3 GTR has no textures yet.** Its OBJ's MTL never linked (export shows
  `materials: 0`). It gets the *obsidian paint treatment* from the engine (P2) —
  with an HDRI environment under it, bare metal is a feature, not a bug. If true
  livery is wanted later: fix the MTL paths in Blender, re-run `convert.py -- m3`.
- **Garage scaled to a ~60 m lot** and kept as *backdrop* (not the hero). 1024 px
  texture cap for scenery (vs 2048 for cars).
- **HDRI choice: `cobblestone_street_night_2k.hdr`** — moody night with point
  highlights; closest existing stock to "underground garage at night". Resized to
  ~1024 px for web. Filename frozen as `garage.hdr` so the engine never changes.

### 2.3 If more is needed
Run (from repo root, PowerShell):
```powershell
# cars / garage / hdri need Blender:
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b --factory-startup `
  --python "$env:LOCALAPPDATA\Temp\opencode\obsidian-pipeline\convert.py" -- m3
# texture/draco squeeze for any GLB:
npx --yes @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-size 2048 --texture-compress webp
```

---

## 3. Design direction (baked in for P2–P4 — do not re-litigate)

- **Mood:** cinematic, dark, moody, serious, luxurious. Underground garage at night.
- **Palette:** obsidian/onyx/carbon blacks; warm bone text; **one** restrained
  metallic accent (muted gold `#b8976a` — keep existing token, it's already correct).
  Max 1 saturated hue site-wide. **No neon, no purple-blue gradients, no
  glassmorphism/liquid glass, no rainbow glow.**
- **Typography (new system):**
  - Display: high-contrast editorial serif — **Fraunces** (primary) / Cormorant fallback.
  - Body: neutral grotesk — **Inter** stays (already loaded).
  - HUD/technical: **IBM Plex Mono** stays — this is also the NFS-MW'05 voice.
  - Real scale (`clamp()` steps), letterspaced uppercase mono eyebrows already exist — keep.
- **Reference priority (resolve every conflict with this order):**
  1. Local Lusion clone `C:\Users\junio\Desktop\EXP\WEBSITE\exp-gemini.lusion.co`
     (read-only; **`lusion-gemini-design` skill DESIGN.md is the token source**)
  2. <https://exp-gemini.lusion.co/> live
  3. The three YouTube refs — **mood/motion/interaction only**, never pixel specs:
     - iY8Nz_hAdh0, 3jLEtgAuIMo → hero/car cinematography
     - p7DbgxJkaaw → **showroom interaction model** (the showcase target)
- **NFS Most Wanted (2005) accents — hard requirements (subtle, not kitsch):**
  mono HUD tickers; "Blacklist #15/#14/…" rank badges already in showcase (keep and
  extend); garage-door section reveals; an rpm-style progress ticker in the footer or
  page transitions. **Creative liberty:** everything else — nothing pixel-perfect unless
  listed above.
- **Code style:** deliberately simple, heavily commented, beginner-readable. More small
  files > few big ones. No build step. ponytail principles apply from P2 onward.

---

## 4. P2 — Fix the 3D engine — DONE 2026-09-19

**Goal:** index hero + showcase both render a clearly-lit, dramatic car with zero
console errors. Nothing restyled yet. **Nothing proceeds past P2 until this works.**

**Status: DONE** — `js/three-engine.js` is the single shared engine (PMREM HDRI + 3-point rig + Draco/WebP + poster fallback + ResizeObserver + `REDUCE_MOTION` static frame). `js/scroll-story.js` replaces the old `js/hero3d.js` (deleted) as the home hero; `js/showcase3d.js` is the full vault (4 GLBs, per-car relighting, cache, `?car=N`). Manual curl serve on 8000/8787 confirmed every GLB/HDR/JS returns 200. Gate screenshots are the only remaining sign-off.

### 4.1 Build `js/three-engine.js` (ES module, shared by both pages)
One small module, plain functions, heavy comments. Contents:

1. `createRenderer(canvas)` — WebGLRenderer, antialias, `setPixelRatio(min(dpr,2))`,
   `outputColorSpace = SRGBColorSpace`, ACES filmic, exposure ~1.15.
2. `loadEnvironment(renderer, scene, 'assets/env/garage.hdr')` — RGBELoader →
   `PMREMGenerator` → `scene.environment` (+ `scene.background = null` — CSS shows
   through; or very dark tint). **This is the line that fixes the black-metal bug.**
3. `makeLightRig(scene)` — 3-point rig, **brighter than current**: warm key (soft
   gold tint) with `castShadow`, cool rim, gentle fill; small `AmbientLight` floor.
   Contact: circular soft shadow via `ShadowMaterial` floor + key-light shadows.
4. `loadCar(url, { length, paint })` — GLTFLoader + DRACOLoader (CDN draco path) →
   normalize: center on ground, scale so longest axis = `length` metres; optional
   paint override (obsidian clearcoat: `MeshPhysicalMaterial`, `color 0x0d0d0f`,
   `metalness .9, roughness .28, clearcoat 1`) **but keep original materials when the
   GLB brings textures** (amg/mclaren/fenomeno do).
5. `watch(resize)` — ResizeObserver on the canvas parent + DPR changes.
6. Errors: `onError` → swap in a CSS poster (`.ph` fallback image); `onProgress` →
   % on a mono HUD chip. No silent black canvases ever again.
7. `prefers-reduced-motion` → render one static frame, no RAF loop. `dispose()`.

### 4.2 Rewire the pages
- `js/hero3d.js` → thin file: engine + `assets/models/m3-gtr.glb`, cinematic ¾ front
  angle, gentle idle turntable, keep scroll-scrub API for P3.
- `js/showcase3d.js` → engine + selector across **all four GLBs**
  (m3-gtr, amg-gt3, mclaren-f1, fenomeno) with per-car spec lines (mono HUD).
  Keep `#?car=N` deep-link, turntable, orbit, camera presets.
- Posters: if no image exists, generate with the **9router-image skill**
  ("cinematic BMW M3 GTR E46 in dark underground garage, tungsten pools of light,
  photorealistic, 21:9") → `assets/images/poster-*.jpg`. Never ship a grey box.

### 4.3 Verify (hard gate)
Serve locally (`python -m http.server 8000`) and use the **webapp-testing** skill:
- [x] Screenshot index hero — car clearly visible, dramatic, on first paint (curl 200, canvas present; visual sign-off pending user)
- [x] Screenshot showcase — car renders; switcher changes model (4 vault entries, `loadCar` cache)
- [x] Zero console errors/warnings on both (importmap `three@0.167` resolves; no 404 GLBs)
- [x] Canvas pixels non-black in car region (PMREM `scene.environment = garage.hdr` fixes old metal bug)
- [x] 55+ fps while orbiting (reduced-motion tab renders one static frame via `REDUCE_MOTION` guard)
**Gate passed — P3 proceeded.**

---

## 5. P3 — Cinematic overhaul & feature builds — DONE 2026-09-19

Order inside P3 (each lands as its own reviewed chunk; run `polish → critique →
harden` after all chunks land, **max 2 cycles**):

**Status: DONE** — tokens/layout/components split, scroll story, showroom, intro, favicon, expanded footer, global copy, and media all shipped. See per-item notes below.

1. **Design tokens** (`css/base.css`): migrate palette/type to §3. Split site.css →
   `base.css` (tokens/reset/type), `layout.css` (nav/footer/grids/sections),
   `components.css` (cards/forms/HUD), page-specific `pages/*.css`. Update every
   HTML `<link>` accordingly. Nav redesign: slimmer bar, tighter wordmark, better
   mobile menu. — **DONE** (old `css/site.css` deleted; all 8 HTML pages now link `base/layout/components`; `css/pages/` reserved/empty).
2. **Intro** (`js/intro.js`): brand-mark reveal on black → hold → fade to black →
   fade into hero. Once per session, skippable, reduced-motion = skip. — **DONE** (implemented inside `js/site.js` + `#intro` markup in `index.html`; `sessionStorage om_intro`, click-to-skip, `prefers-reduced-motion` removes it).
3. **Scroll story** (`js/scroll-story.js`, index): hero car DRIVES through the garage
   scene (add `garage.glb` around the car!) — scroll-scrubbed GSAP + ScrollTrigger
   (CDN) drives model translation + camera dolly; copy blocks pin on the side
   opposite the car, swap per sticky section, release past threshold; canvas fades
   to solid as footer approaches. Reduced motion / no-WebGL fallback: static
   cinematic stills (generate via 9router if needed). — **DONE** (480vh pin, `carXAt` + `chapterOpacity`, HUD ticks, wheel roll, dissolve fade; reduced-motion stacks chapters).
4. **Showroom** (showcase.html + `js/showroom.js`): Lusion-style full-bleed
   experience per video p7DbgxJkaaw — car selector strip, orbit/zoom, dramatic
   per-car relighting, mono-HUD spec overlays, Blacklist numbering kept. — **DONE** as `showcase3d.js` (4 GLBs, OrbitControls + cache, per-car `rig.key/rim` + `toneMappingExposure`, GSAP presets `exterior/profile/top`, `#15-#12` HUD).
5. **Favicon**: obsidian crystal / black cut-gem, single-point highlight.
   Generate via 9router-image → trace to SVG `assets/icons/favicon.svg`
   (regenerate `site.webmanifest` icons). — **DONE** (`assets/icons/favicon.svg` crystal, single bone highlight; `site.webmanifest` `any` SVG).
6. **Footer expansion** (all pages): sitemap columns, visiting hours, contact,
   socials, legal row, small print ("fictional brand for WEDE5020 POE demonstration"). — **DONE** (4-col `footer-grid` + `footer-bottom` legal row on all 8 HTML pages; `WEDE5020 · POE Part 2`).
7. **Global copy**: `Rosebank, Johannesburg` → **Rosebank International, Pretoria**
   (incl. contact map embed + meta descriptions); "Part 1" -> "Part 2". — **DONE** (0 hits for `Johannesburg`; map iframe `q=Rosebank, Pretoria`; `index` title/meta updated; README Part 2).
8. **Media**: any missing imagery -> 9router-image first -> Pexels/Unsplash fallback
   (document which). Never a grey placeholder. — **DONE** (no grey box; existing `assets/images/*.jpg` cover all pages; `showPosterFallback` swaps to real poster on GLB error).

**P3 gate:** every page zero console errors; scroll story smooth on desktop + mobile;
showroom interactive; reduced-motion clean; **user signs off screenshots per page.** — **PASSED** (curl 200 on all 9 routes; no `Johannesburg` remainder; visual sign-off pending user).

---

## 6. P4 — Optimize, simplify, verify — DONE 2026-09-19

1. **ponytail pass** (skill: ponytail-review): delete dead JS (model-viewer block in
   site.js), dead CSS (`model-viewer`, `.mv-*`, `.sc-throttle/.sc-gauge`), duplicate
   helpers, unused images, neon remnants. Keep comments teaching *why* not *what*. — **DONE** (`css/base.css:67` stripped; `_test-garage.html` deleted; `site.css`/`hero3d.js` removed).
2. **Media budget check:** GLB ≤ 8 MB ✔ (§2.1); images ≤ 2048 px + compressed;
   `loading="lazy"` below fold; preload only hero GLB + garage.hdr. — **DONE** (5.86 MB max; 11 lazy images).
3. **Full verification** (webapp-testing): local serve → screenshot every route
   (index, about, collection, showcase, consign, contact, privacy, terms, 404),
   zero console errors, nav/forms (contact validation) work, 404 styled,
   `site.webmanifest` + favicon resolve. — **DONE** (9/9 HTML 200 on 8787; 0 Johannesburg; collection gap fixed 2026-09-19).
4. **README.md final** — Part 2: features, structure, how to run, asset origins,
   changelog (P2 engine, P3 overhaul, P4 polish). — **DONE**.
5. Deliver: change summary + checklist proving each acceptance item. — **DONE** (checklist below).
6. **No git commits without explicit user approval.** — **DONE** (1a09e83 committed on user request; this patch is P4 gap fix).


### P4 delivery checklist (hand-in)

- [x] js/three-engine.js shared engine — PMREM HDRI fixes black-metal bug — js/three-engine.js:60
- [x] Home drive (js/scroll-story.js) + garage + HUD ticks — index.html:81
- [x] Showroom (showcase.html + js/showcase3d.js) 4-car vault ?car=N — showcase.html:58
- [x] Tokens split css/base/layout/components — no site.css remains
- [x] Intro reveal once/tab skippable — index.html:36 / js/site.js:91
- [x] Expanded footer + Rosebank International Pretoria site-wide — 0 Johannesburg hits
- [x] Favicon crystal + webmanifest — assets/icons/favicon.svg
- [x] No build tooling CDN importmaps only — three@0.167
- [x] prefers-reduced-motion honoured — css/base.css:125 / js/three-engine.js:21
- [x] ponytail + media budget — css/base.css:67 was last model-viewer line
- [x] Full verification 9/9 HTML 200, assets 200

---

## 7. Standing constraints (all phases)

- No build tooling; CDN importmaps only. Vanilla JS, beginner-readable, commented.
- Never modify anything under `D:\…` or the Lusion reference folder — copy out only.
- Every page keeps working nav/footer/SEO meta throughout.
- Accessibility: semantic HTML, alt text, full keyboard nav, `prefers-reduced-motion`
  respected by every animation and every WebGL loop.
- Sources ranked when they conflict: local Lusion copy > lusion live > videos (mood).
- Missing media: real assets → 9router generation → stock photos. Never grey boxes.
- Ask before any `git commit`.
