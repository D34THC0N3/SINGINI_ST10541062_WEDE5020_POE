# Obsidian Motors — WEDE5020 POE Part 2

A dark, cinematic private-collection site for ultra-rare cars. Part 2 moves the 3D from "black canvas" to a properly lit underground-garage showroom — with a scroll-driven drive on the home page and a full-bleed orbit showroom.

Live premise: **Obsidian Motors** sources, verifies and quietly places the world's rarest cars from **Rosebank International, Pretoria** (WEDE5020 / ST10541062 / fictional brand for coursework).

## Pages

| Page | What it is |
|------|------------|
| `index.html` | The Drive — scroll-scrubbed M3 GTR through the underground garage + editorial sections |
| `showcase.html` | Full-bleed 3D showroom — orbit/zoom the 4 cars, per-car relighting, Blacklist HUD, `?car=N` deep-link |
| `collection.html` | Blacklist cards → deep-link into the showcase |
| `about.html` | How we source (private acquisitions · Dubai recovery) |
| `consign.html` / `contact.html` | Consignment + enquiry forms (client-side validation) |
| `privacy.html` / `terms.html` / `404.html` | Legal + styled 404 |

## How to run

No build step. Open through a local server so the GLBs load (file:// blocks them on some browsers):

```powershell
# from the repo root
python -m http.server 8000
# then http://localhost:8000
```

VS Code "Live Server" works the same way.

## Stack

- Pure **HTML + CSS + JS** on CDN `importmap` — no bundler (school constraint).
- **Three.js 0.167** (`three` + `three/addons/` via jsDelivr).
- **GSAP 3.12.5 + ScrollTrigger** for the scroll story and showroom dolly moves.
- Fonts: **Fraunces** (display serif), **Inter** (body), **IBM Plex Mono** (HUD/mono).

## Project layout

```
index.html  showcase.html  collection.html  about.html  consign.html  contact.html  404.html
css/
  base.css        # tokens, reset, type, atmosphere (loaded first)
  layout.css      # nav, sections, story, footer, 404, responsive
  components.css  # buttons, cards, forms, HUD, reveal, media plates
  pages/          # reserved for page-specific overrides (empty in Part 2)
js/
  three-engine.js # ONE shared 3D engine (renderer + HDRI PMREM + light rig + loadCar/loadScenery)
  scroll-story.js # home: car path vs scroll, chapter windows, HUD ticks, garage backdrop
  showcase3d.js   # showroom: 4-car vault, orbit, cache, per-car light, presets via GSAP
  site.js         # scroll dots, reveal, nav, intro-once-per-tab, page fade, counters
assets/
  models/  m3-gtr.glb  amg-gt3.glb  mclaren-f1.glb  fenomeno.glb  garage.glb
  env/     garage.hdr  (night-garage HDRI, 1024px)
  images/  alpine-garage.jpg  amg-gt3.jpg  gt2rs.jpg  zonda-f.jpg  etc.
  icons/   favicon.svg
```

## Where the cars came from (and how they were made web-ready)

| GLB (in repo) | Source file | Method |
|---------------|-------------|--------|
| `m3-gtr.glb` (1.35 MB) | `M3 GTR / model.obj` | Blender: OBJ -> normalize to 4.6 m -> Draco GLB |
| `amg-gt3.glb` (5.86 MB) | `mercedes-amg-gt3-evo-2020/...glb` (49.5 MB) | `gltf-transform optimize --compress draco --texture-size 2048 --texture-compress webp` |
| `mclaren-f1.glb` (1.73 MB) | `mclaren-f1-gtr-longtail/...glb` (14.7 MB) | same |
| `fenomeno.glb` (4.22 MB) | `lamborghini-fenomeno-2025/...glb` (38.3 MB) | same |
| `garage.glb` (1.77 MB) | `Underground+Garage+Scene.fbx` | Blender: single-user -> apply -> scale to ~60 m -> GLB -> gltf-transform (draco + 1024 webp) |
| `garage.hdr` (1.76 MB) | `cobblestone_street_night_2k.hdr` | Blender: resize to 1024px wide |

All GLBs <= 8 MB. Draco + WebP decoders are pointed at `cdn.jsdelivr.net/npm/three@0.167.0/examples/jsm/libs/draco/gltf/` via `DRACOLoader` in `three-engine.js`.

`m3-gtr.glb` ships with no textures (its OBJ MTL had zero materials) — the engine gives it the obsidian clearcoat (`MeshPhysicalMaterial { color #0c0c0e, metalness .9, roughness .28, clearcoat 1 }`). With the HDRI `scene.environment` underneath, that reads as obsidian paint, not a bug. To give it a true livery later, fix MTL paths in Blender and re-run the pipeline.

To re-run any conversion (requires `blender.exe` 4.5 LTS + `@gltf-transform/cli`):

```powershell
& "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe" -b --factory-startup `
  --python "$env:LOCALAPPDATA\Temp\opencode\obsidian-pipeline\convert.py" -- m3
npx --yes @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-size 2048 --texture-compress webp
```

## Design direction

- **Mood:** cinematic, dark, serious, luxurious — underground garage at night.
- **Palette:** obsidian / carbon blacks + warm bone (`#ede8e0`), one metallic gold `#b8976a`. Max one saturated hue. No neon, no purple-blue gradients, no glassmorphism.
- **Type:** Fraunces (display) / Inter (body) / IBM Plex Mono (HUD).
- **Nods to NFS Most Wanted (2005):** mono HUD ticks, Blacklist `#15/#14/...` badges, rpm-style progress strip, garage-door section rules — kept subtle.

## 3D notes (the thing Part 1 got wrong)

Metallic paint reflects its *environment*, not just its lights. Part 1 painted every mesh `MeshStandardMaterial { metalness: .92 }` with **no `scene.environment`** — so the car was a black shape on a black page. Part 2 fixes it with `RGBELoader -> PMREMGenerator -> scene.environment` (the `garage.hdr` night) plus a brighter 3-point light rig with a real contact shadow. `three-engine.js` is the only file that touches WebGL — both pages are thin wrappers on top of it.

`prefers-reduced-motion` is honoured everywhere: the drive stacks as plain sections, both 3D scenes render a single still frame, and no RAF loop runs.

## Forms and validation

`contact.html` and `consign.html` use `novalidate` + lightweight `site.js` validation: required fields show an inline mono hint, successful submit shows the `data-ok` note (no backend — the demo stops there).

## References

- Three car-display YouTubes (mood/motion only): `iY8Nz_hAdh0`, `3jLEtgAuIMo`, showroom interaction model `p7DbgxJkaaw`
- Dark site study: `exp-gemini.lusion.co` (local clone at `C:\Users\junio\Desktop\EXP\WEBSITE\exp-gemini.lusion.co`)
- Code reference for 3D landing-page structure: `Footprintarts/3D_LandingPage` (GitHub)
- Imagery: existing `assets/images/*.jpg` + generated posters if needed (9router-image first, then Pexels/Unsplash fallback — no grey placeholder ships)

## Changelog

- **Part 1:** initial static site; 3D hero + showcase (no environment map — rendered dark), single `site.css`, `model-viewer` + dark/gradient styling.
- **Part 2 — P2 (engine fix):** new `three-engine.js` (PMREM HDRI, 3-point rig, Draco, poster fallback, ResizeObserver, reduced-motion); rewired `scroll-story.js` + `showcase3d.js` around it; asset pipeline (4 cars + garage + HDRI) with Draco/WebP.
- **Part 2 — P3 (cinematic overhaul):** split `site.css -> base/layout/components`; new scroll story (car drives through garage, chapters pin opposite the car, HUD ticks, dissolve); Lusion-style full-bleed showroom; intro reveal (once per tab, skippable); slimmer nav + expanded 4-column footer; global copy `Rosebank, Johannesburg -> Rosebank International, Pretoria`; favicon crystal.
- **Part 2 — P4 (polish):** ponytail pass (remove `model-viewer` dead CSS/JS), image lazy-loading + preload discipline, full route verification, this README, and the final delivery checklist in `IMPLEMENTATION_PLAN.md`.
