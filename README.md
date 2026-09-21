# Obsidian Motors

my WEDE5020 POE site. fake shop for super rare cars lol. all black, one gold accent, grain and vids everywhere. i was going for night-driving, need for speed most wanted vibes.

## pages

index is home with the big video and a proper loading screen now (crystal spins, counts to 100, door lifts into the hero). collection has the cars drifting sideways forever, hold one and it blows up fullscreen. about is the story with sticky picture chapters. consign is the sell-your-car form. contact is enquiries. privacy + terms are the boring legal ones. 404 catches dead links.

## run it

    python -m http.server 8000

then open http://localhost:8000. no build step, no npm, just html css and js.

## what i added

garage-door page transition (my fav thing here), the index intro with the crystal logo i drew myself as an svg, drifting cards with a heat meter, fullscreen hover dossiers, a menu that opens in a circle and morphs the burger into an X, custom cursor with lil labels, fullscreen footer that rolls u into the next page if u keep scrolling (stole that from lusion lol), gold road line that draws as u scroll, bokeh lights, headings that lean when u scroll fast. typing "nos" fires a speed burst. everything turns itself off with prefers-reduced-motion. street tapes is a wall of 6 clips now and theres video all over the place. also redrew the favicon as a proper obsidian gem with png fallbacks.

## libs

gsap + ScrollTrigger + Observer for all the animation, files live in assets/vendor so it works offline. i thought about three.js for a 3d showroom but ran out of time, dom + video got me the look anyway. fonts are google (fraunces, kanit for the big slanted headings, inter, ibm plex mono). vids all live in assets/videos now (i deleted the empty spare folder), pics in assets/images with the big originals in assets/images/hd/. car photos came from wikimedia commons, every card finally shows the right car. js picks lighter files on slow connections.

## hard parts

the door timing took forever, it kept flashing open before the new page painted. peek on the cards still fights the drag a tiny bit if u move the mouse at the exact wrong moment. with more time id do the door as a real webgl shader, dom stripes got me most of the way there tho.
