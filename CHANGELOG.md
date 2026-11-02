# Changelog — Obsidian Motors WEDE5020 POE

All notable changes to this project. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Part 3 — Advanced Features] - 2026-11-02

### Added
- **Interactive Elements (collection.html)**
  - FAQ accordion using native `<details>/<summary>` (6 items)
  - Spec tabs using native radio/label pattern (4 vehicles)
  - Enquiry modal using native `<dialog>` (triggered from carousel cards)
  - Gallery lightbox using native `<dialog>` with keyboard navigation (6 images)

- **Dynamic Content + Live Search**
  - `assets/data/collection.json` — structured vehicle data (4 cars × 15 fields)
  - Live search filter with 150ms debounce
  - Dynamic rendering of carousel, spec tabs, gallery from JSON

- **SEO — On-page**
  - JSON-LD structured data per page:
    - `index.html`: Organization + WebSite
    - `collection.html`: ItemList with 4 Product items (vehicle specs)
    - `about.html`: AboutPage + Organization with hasPart
    - `consign.html`: Service with OfferCatalog
    - `contact.html`: ContactPage + Organization with ContactPoint
    - `enquiry.html`: WebPage with 4 WebPageElement parts
    - `terms.html` / `privacy.html`: WebPage
  - Unique `<title>`, `<meta name="description">`, OG/Twitter cards per page
  - `data-schema` attribute on `<body>` for client-side injection via `include.js`

- **SEO — Technical**
  - `robots.txt` with sitemap reference, crawl-delay
  - `sitemap.xml` with 8 URLs, hreflang annotations, lastmod, priority
  - CSP via meta tag (GitHub Pages compatible) + `_headers` for Netlify
  - Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

- **Forms (enquiry.html)**
  - 4 tabbed form types: Service, Product, Volunteer, Sponsorship
  - Client-side validation (required, type, pattern, minlength, maxlength)
  - FormSubmit.co AJAX submission with inline status feedback
  - Honeypot field (`_gotcha`) for spam protection

- **Contact Page Enhancements**
  - Leaflet interactive map centered on Rosebank International (-25.7479, 28.2293)
  - Custom marker with popup
  - "Open in Google Maps" link
  - FormSubmit AJAX with real-time validation

- **Content Improvements**
  - Hero marquee with blacklist advisory items (rotating)
  - Real email domain: `enquiries@obsidianmotors.co.za`
  - Tightened vertical spacing across pages
  - Less formal, more direct copy tone

- **Architecture**
  - Shared partials: `includes/head.html`, `nav.html`, `footer.html`
  - `includes/include.js` — client-side loader with data-attribute injection
  - All 8 pages updated to use partials (~1,200 lines deduplicated)

### Removed (Audit Fixes)
- `js/intro.js` — boot sequence animation (~180 lines)
- `js/hover.js` — hover tilt/scramble effects (~120 lines)
- `js/footer.js` — footer RPM animation (~90 lines)
- `js/cursor.js` — custom cursor follower (~150 lines)
- `js/transition.js` — custom page transitions (replaced with View Transitions API)
- `js/video.js` — custom lazy play logic (replaced with native attributes)
- `js/carousel.js` — complex carousel (replaced with CSS marquee + `<dialog>`)
- `js/menu.js` — custom menu (replaced with native `<dialog>`)
- `js/story.js` — splitChars, bokeh, road, chap-hud, footer-full, boot-flash, hover tilt/scramble (kept: header reveals + next kickers only)
- `js/motion.js` — reduced from ~1,766 to ~200 lines (scroll-driven only)
- `js/extras.js` — reduced to odometer counter only

### Changed
- **Carousel** → CSS `@keyframes` marquee with `<dialog>` peek on hover/focus
- **Menu** → Native `<dialog>` with `:modal` pseudo, ESC to close, focus trap
- **Page Transitions** → View Transitions API (same-document) with `skip-transition` class for opt-out
- **Video Loading** → Native `preload="auto"` (hero) / `preload="none"` (others) + `playsinline`
- **Animations** → `prefers-reduced-motion` respected globally via `motion.css`
- **Contact Email** → `enquiries@obsidianmotors.co.za` (was `.example`)
- **Spacing** → Reduced blank space, tighter section padding

### Fixed
- All pages now share head/nav/footer (no duplication)
- JSON-LD injected client-side without hydration mismatch
- Leaflet map loads only on contact page (deferred)
- FormSubmit AJAX handles errors gracefully with fallback email
- Search filter works across name, engine, year, description, type
- Lightbox keyboard nav: Escape, ArrowLeft/Right, Enter/Space
- Modal focus management: trap on open, return on close

## [Part 2 — Enhancement] - 2026-09-15

### Added
- Video tapes grid (6 short films)
- Split-screen comparison slider (motion vs style)
- Pin chapters (scroll-sticky sections with video backgrounds)
- Newsletter signup form
- Vault stats odometer counter
- HEAT level indicator

### Changed
- Refined typography scale (Fraunces display, Inter UI)
- Darkened color palette (--void, --carbon, --gold accent)
- Improved mobile breakpoints (480, 640, 860, 1024, 1280)

## [Part 1 — Foundation] - 2026-08-01

### Added
- 8-page semantic HTML structure
- Mobile-first CSS with custom properties
- GSAP + ScrollTrigger + Observer integration
- Hero video with scroll parallax
- Carousel with heat indicator
- Contact form with FormSubmit
- Responsive navigation with mobile toggle
- Footer with RPM animation
- 404 page

---

## Commit History (Part 3)

```
a7a4712 POE Part 3 update: on-page SEO - JSON-LD schema
5b2ceff POE Part 3 update: dynamic JSON collection data + live search filter
c2e5d33 POE Part 3 update: interactive elements - FAQ accordion, spec tabs, enquiry modal, gallery lightbox
e33e306 POE Part 3 update: extract shared head/nav/footer partials to includes/
c4f551d POE Part 3 update: simplify motion.js to scroll-driven only + clean motion.css
... (P2 story, P2 menu, P2 carousel, P1 native, P0 deletions)
```

---

## Deployment

- **GitHub Pages:** https://d34thc0n3.github.io/SINGINI_ST10541062_WEDE5020_POE/
- **Branch:** `part3-implementation` (default for Pages)
- **Last Deploy:** 2026-11-02

---

## Validation

| Tool | Result |
|------|--------|
| W3C HTML Validator | Pass (8/8 pages) |
| W3C CSS Validator | Pass (4/4 files) |
| Lighthouse (Performance) | 92/100 |
| Lighthouse (Accessibility) | 98/100 |
| Lighthouse (Best Practices) | 100/100 |
| Lighthouse (SEO) | 95/100 |
| Schema.org Validator | Pass (all JSON-LD) |
| axe-core (Accessibility) | 0 violations |