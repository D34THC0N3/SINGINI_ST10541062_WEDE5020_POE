# Obsidian Motors

my WEDE5020 POE site. fake shop for super rare cars lol. all black, one gold accent, grain and vids everywhere. i was going for night-driving, need for speed most wanted vibes.

## pages

index is home with the big video and the intro that counts to 100. collection has the cars in a sideways carousel. about is the story with sticky picture chapters. consign is the sell-your-car form. contact is enquiries. privacy + terms are the boring legal ones. 404 catches dead links.

## run it

    python -m http.server 8000

then open http://localhost:8000. no build step, no npm, just html css and js.

## what i added

garage-door page transition (my fav thing here), the index intro with the crystal logo i drew myself as an svg, draggable carousel with a heat meter, custom cursor with lil labels, fullscreen footer that rolls u into the next page if u keep scrolling (stole that from lusion lol), circle menu with a pic that chases ur mouse, gold road line that draws as u scroll, bokeh lights, headings that lean when u scroll fast. typing "nos" fires a speed burst. everything turns itself off with prefers-reduced-motion.

## libs

gsap + ScrollTrigger + Observer for all the animation, files live in assets/vendor so it works offline. fonts are google (fraunces, kanit for the big slanted headings, inter, ibm plex mono). vids in assets/videos, pics in assets/images, js picks lighter files on slow connections.

## hard parts

the door timing took forever, it kept flashing open before the new page painted. peek on the cards still fights the drag a tiny bit if u move the mouse at the exact wrong moment. with more time id do the door as a real webgl shader, dom stripes got me most of the way there tho.
