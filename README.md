# Obsidian Motors

My WEDE5020 POE site. Fake shop for very rare cars. All black, one gold accent, grain and videos everywhere. Night-driving, Need for Speed Most Wanted vibes.

## pages

- `index.html` — home. Big video, loading screen (crystal spins, counts to 100, door lifts into the hero).
- `collection.html` — the cars drift sideways. Search by name or engine, filter road vs track, click a photo to blow it up fullscreen.
- `about.html` — the story, with sticky picture chapters.
- `consign.html` — sell or consign your car.
- `contact.html` — enquiry form, checked as you type before it opens your mail app.
- `enquiry.html` — service, acquisition and press forms in tabs.
- `privacy.html`, `terms.html`, `404.html` — the quiet pages.

## run it

    python -m http.server 8000

Then open http://localhost:8000. No build step, no npm. HTML, CSS, JS.

## what's in it

Garage-door page transitions. The intro crystal I drew as an SVG. A menu that opens in a circle. Custom cursor with labels. Fullscreen footer that rolls you into the next page. Gold road line that draws as you scroll. Headings rise letter by letter, cards lean towards the mouse, images drift slower than the page. Search, filters and a photo viewer on the collection. Form validation on contact. Everything switches off with `prefers-reduced-motion`. Typing `nos` fires a speed burst.

## libs

GSAP, ScrollTrigger and Observer. Files sit in `assets/vendor`, so it works offline. Fonts are Google: Fraunces, Kanit, Inter, IBM Plex Mono. Videos in `assets/videos`, photos in `assets/images`, originals in `assets/images/hd/`. Car photos from Wikimedia Commons. Smaller files are picked on slow connections.

## known limits

The door timing was fussy — it kept opening before the new page painted. Card peek still argues with the drag if you move the mouse at the exact wrong moment. The contact form hands off to your mail app instead of sending on the server; a FormSubmit endpoint handles the enquiry page. Given more time I'd do the door as a real WebGL shader.

Fictional brand. Student project.
