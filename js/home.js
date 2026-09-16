/* ============================================================
   OBSIDIAN MOTORS — home.js  (home page only, loaded after site.js)
   Two bits of motion the other pages don't need:
     1. Sticky hero "scrub" — as you scroll through the tall hero
        track, --p goes 0 → 1. The CSS uses --p to spin the wheel,
        drift the wordmark, and fade the lead. JS just reports how
        far you've scrolled; the CSS does the animating.
     2. HUD telemetry + count-up figures — numbers that climb.
   Reduced motion: no scrub, numbers show their final value at once.
   No libraries. If this file doesn't load, the page still reads fine.
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. sticky hero scrub: set --p (0→1) + HUD telemetry ---- */
  var hero = document.querySelector(".hero");
  if (hero && !reduce) {
    var speed = document.querySelector("[data-hud-speed]");
    var rpm = document.querySelector("[data-hud-rpm]");
    var gear = document.querySelector("[data-hud-gear]");

    var tick = function () {
      var span = hero.offsetHeight - window.innerHeight; // scrollable distance while pinned
      var p = span > 0 ? (window.scrollY - hero.offsetTop) / span : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;                      // clamp 0..1
      hero.style.setProperty("--p", p.toFixed(4));
      if (speed) speed.textContent = Math.round(p * 320);
      if (rpm) rpm.textContent = Math.round(p * 8250).toLocaleString();
      if (gear) gear.textContent = Math.min(6, Math.floor(p * 6) + 1);
    };
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
  }

  /* ---- 2. count-up figures (data-count on the provenance stats) ---- */
  var run = function (el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var start = null, dur = 1200;
    var frame = function (t) {
      if (start === null) start = t;
      var k = Math.min((t - start) / dur, 1);
      k = 1 - Math.pow(1 - k, 3);                         // ease-out
      el.textContent = Math.round(target * k) + suffix;
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  var figs = document.querySelectorAll("[data-count]");
  if (figs.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      figs.forEach(run);
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      figs.forEach(function (el) { io.observe(el); });
    }
  }
})();
