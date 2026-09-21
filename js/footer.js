/* footer.js - keep scrolling into the next gate, like a runway into the next page */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  var footer = document.querySelector("footer.footer");
  if (!footer || reduce || touch) return;

  // figure out where "next" is. just follows the nav order
  var order = ["index.html", "collection.html", "about.html", "consign.html", "contact.html"];
  var here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var i = order.indexOf(here);
  var next = order[(i + 1) % order.length];
  var nextName = next.replace(".html", "").replace(/^\w/, function (c) { return c.toUpperCase(); });
  if (next === here) return;

  // wait for the fullscreen clone from motion.js (its in there already)
  var tries = 0;
  var poll = setInterval(function () {
    var fClone = document.querySelector(".footer-full");
    if (fClone || ++tries > 40) {
      clearInterval(poll);
      if (fClone) attach(fClone);
    }
  }, 100);

  function attach(fClone) {
    // slow garage loop behind the crystal, barely there
    var loop = document.createElement("video");
    loop.setAttribute("aria-hidden", "true");
    loop.muted = true; loop.loop = true; loop.playsInline = true;
    loop.preload = "none";
    loop.poster = "assets/images/still-zonda-mileson.webp";
    loop.setAttribute("data-src", "assets/videos/zonda-mileson-4k.mp4");
    loop.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.15;pointer-events:none;filter:saturate(.85) brightness(.8)";
    fClone.insertBefore(loop, fClone.firstChild);
    if (window.OM && window.OM.video) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) {
            if (!loop.getAttribute("src")) { loop.setAttribute("src", loop.getAttribute("data-src")); loop.load(); }
            window.OM.video.play(loop);
          } else window.OM.video.stop(loop);
        });
      }).observe(loop);
    }
    // next gate block, click or scroll down to go
    var gate = document.createElement("div");
    gate.className = "next-gate";
    gate.innerHTML =
      '<p class="ng-label">KEEP SCROLLING ▸ NEXT GATE</p>' +
      '<a class="ng-link" href="' + next + '" data-cursor="VIEW">' +
      '<svg class="ng-ring" viewBox="0 0 40 40" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="17" class="ng-track"/>' +
      '<circle cx="20" cy="20" r="17" class="ng-prog"/>' +
      '</svg>' + nextName + ' →</a>';
    fClone.appendChild(gate);
    var prog = gate.querySelector(".ng-prog");
    var C = 2 * Math.PI * 17;
    prog.style.strokeDasharray = C;
    prog.style.strokeDashoffset = C;

    var charge = 0, lastWheel = 0;
    addEventListener("wheel", function (e) {
      // only counts while the footer is blown up and scrolling down
      if (getComputedStyle(fClone).visibility !== "visible") { charge = Math.max(0, charge - 4); return; }
      if (e.deltaY <= 0) return;
      charge = Math.min(100, charge + e.deltaY * 0.14);
      lastWheel = Date.now();
      prog.style.strokeDashoffset = C * (1 - charge / 100);
      if (charge >= 100) {
        charge = -9999; // dont fire twice lol
        location.href = next;
      }
    }, { passive: true });
    // bleeds off if u stop scrolling
    setInterval(function () {
      if (charge > 0 && charge < 100 && Date.now() - lastWheel > 900) {
        charge = Math.max(0, charge - 6);
        prog.style.strokeDashoffset = C * (1 - charge / 100);
      }
    }, 300);

    // hysteresis: motion.js reopens the footer every time, stop the loop
    // after u close it once, it has to wait for a real scroll-up first
  }
})();
