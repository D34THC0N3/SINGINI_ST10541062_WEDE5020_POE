# Changelog — Obsidian Motors WEDE5020 POE

All notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Part 3 — Advanced Features] - 2026-11-02

### Added
- **Collection search and filter** — `js/collection.js`. Search by name or engine, filter road vs track, live count.
- **Photo lightbox** — clicking a still on the collection opens it fullscreen. Escape or the close button exits, focus returns to the card.
- **Contact form validation** — `js/forms.js`. Checks as you type, shows a message under each field, then hands the message to your mail app.
- **Message type field** on the contact form, so enquiries arrive sorted.
- **SEO** — unique titles, descriptions and OG/Twitter cards per page, JSON-LD on every page, `robots.txt`, `sitemap.xml`, `_headers` for security headers.
- **Tabbed enquiry page** — service, acquisition, press and partnerships forms with inline validation.

### Changed
- Footer credit to POE Part 3. Email is `enquiries@obsidianmotors.co.za` everywhere.
- Ticker and footer marquee now run in opposite directions.
- Nav logo and hero copy sit closer to the left edge.
- Softer, bouncier easing on buttons, cards and panels (`--ease-bounce`).
- Hero heading, lead and buttons animate in sequence on load; hero video drifts on scroll.

### Fixed
- `var(--teal)` was never defined — all uses now point at `var(--gold)`.
- Ticker text and marquee copy corrected to the agreed strings.
- Form success note no longer renders in an undefined colour.

## [Part 2 — Enhancement] - 2026-09-15

### Added
- Video tapes grid (6 short films)
- Split-screen comparison slider
- Pin chapters (sticky sections with video beds)
- Vault stats odometer
- HEAT level indicator

### Changed
- Typography scale refined (Fraunces display, Inter body)
- Palette darkened around `--void`, `--carbon` and one gold accent
- Mobile breakpoints at 480, 640, 860, 1024, 1280

## [Part 1 — Foundation] - 2026-08-01

### Added
- 8-page semantic HTML structure
- Mobile-first CSS with custom properties
- GSAP, ScrollTrigger and Observer (vendored locally)
- Hero video, carousel, contact form, footer RPM meter, 404 page

---

## Deployment

- GitHub Pages: https://d34thc0n3.github.io/SINGINI_ST10541062_WEDE5020_POE/
- Branch: `Master`
