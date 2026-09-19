# SINGINI_ST10541062_WEDE5020_POE_Part1

WEDE5020 POE Part 1 — Obsidian Motors website.

A dark automotive showcase site for a made-up private car collection. Built with
plain HTML, CSS and JavaScript, plus Three.js for the 3D car bits on the home
page hero and the showcase page.

## Pages

- `index.html` — home, with the intro animation and 3D hero
- `collection.html` — the three cars in "the blacklist"
- `showcase.html` — 3D showroom where you can spin the car around
- `about.html`, `contact.html`, `consign.html`
- `privacy.html`, `terms.html`, `404.html`

The site has a small Need for Speed: Most Wanted (2005) theme running through
it — the blacklist numbering, the BMW M3 GTR as the hero car, that kind of thing.
Was my favourite racing game growing up so I wanted to sneak it in.

## How I made it

I followed a bunch of YouTube tutorials to figure out the tricky parts. These
helped the most:

- <https://youtu.be/iY8Nz_hAdh0> — helped with the 3D car on the page
- <https://youtu.be/3jLEtgAuIMo> — more Three.js / car display ideas
- <https://youtu.be/p7DbgxJkaaw> — the showroom / car viewer functionality

I also looked at this repo for reference on how a 3D landing page is put
together: <https://github.com/Footprintarts/3D_LandingPage>

And the overall look was inspired by <https://exp-gemini.lusion.co/> — I tried
to copy the dark moody vibe (nowhere near as good, but I tried lol).

The car model is my own from Blender (the M3 GTR), exported to GLB. Photos on
the collection and about pages are from Wikimedia Commons.

## Running it

Just open `index.html` in a browser. Because the 3D stuff loads the model file
it works best through a local server (e.g. "Live Server" in VS Code) — opening
straight from disk can block the GLB on some browsers.
