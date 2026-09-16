/* ============================================================
   OBSIDIAN MOTORS — showcase.js  (showcase page only)
   One real <model-viewer>. The switch swaps the identity text +
   camera framing on the same model; Start pauses/plays the
   turntable; "hold to rev" spins it faster; the view buttons
   jump the camera to a preset angle.
   Reduced motion: turntable starts paused.
   No libraries. If this file (or the model) doesn't load, the
   slotted poster shows a plain-text fallback instead.
   ============================================================ */
(function () {
  "use strict";

  var mv = document.getElementById("mv");
  if (!mv) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Same GLB for all three — only the framing + labels change.
  var cars = [
    { name: "Mercedes-AMG GT3", tag: "Track-bred theatre.",            spec: "2019 · Affalterbach · 4.0L twin-turbo V8 · RWD",   orbit: "-30deg 75deg 110%", exposure: "1" },
    { name: "Pagani Zonda",     tag: "Art you can hear.",              spec: "2009 · San Cesario · 7.3L V12 · RWD",             orbit: "25deg 78deg 115%",  exposure: "1.1" },
    { name: "Porsche GT2 RS",   tag: "They called it the widowmaker.", spec: "2018 · Stuttgart · 3.8L twin-turbo flat-6 · RWD", orbit: "-15deg 72deg 105%", exposure: ".95" }
  ];
  var views = { Profile: "-90deg 82deg 105%", Top: "0deg 18deg 125%" }; // Exterior = current car's orbit

  var idxEl   = document.querySelector("[data-sc-index]");
  var nameEl  = document.querySelector("[data-sc-name]");
  var tagEl   = document.querySelector("[data-sc-tag]");
  var specEl  = document.querySelector("[data-sc-spec]");
  var carBtns = document.querySelectorAll(".sc-switch-btn");
  var viewBtns = document.querySelectorAll(".sc-view");

  var current = 0;

  var setActive = function (list, el) {
    list.forEach(function (b) { b.classList.toggle("is-active", b === el); });
  };

  var applyCar = function (i) {
    var c = cars[i];
    if (!c) return;
    current = i;
    if (idxEl)  idxEl.textContent  = "0" + (i + 1);
    if (nameEl) nameEl.textContent = c.name;
    if (tagEl)  tagEl.textContent  = c.tag;
    if (specEl) specEl.textContent = c.spec;
    mv.setAttribute("camera-orbit", c.orbit);
    mv.setAttribute("exposure", c.exposure);
    setActive(carBtns, carBtns[i]);
    setActive(viewBtns, viewBtns[0]); // reset to Exterior
    if (history.replaceState) history.replaceState(null, "", "?car=" + i);
  };

  carBtns.forEach(function (b, i) {
    b.addEventListener("click", function () { applyCar(i); });
  });

  viewBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var label = b.textContent.trim();
      mv.setAttribute("camera-orbit", views[label] || cars[current].orbit);
      setActive(viewBtns, b);
    });
  });

  /* Start = pause/play the turntable */
  var start = document.querySelector(".sc-start");
  var spinning = !reduce;
  if (!spinning) mv.removeAttribute("auto-rotate");
  if (start) {
    var strong = start.querySelector("strong");
    var sync = function () {
      if (strong) strong.textContent = spinning ? "Pause" : "Spin";
      start.setAttribute("aria-pressed", String(spinning));
    };
    sync();
    start.addEventListener("click", function () {
      spinning = !spinning;
      if (spinning) mv.setAttribute("auto-rotate", ""); else mv.removeAttribute("auto-rotate");
      sync();
    });
  }

  /* Throttle = hold to spin faster (rev) */
  var throttle = document.querySelector(".sc-throttle");
  var gauge = document.querySelector(".sc-gauge");
  if (throttle) {
    var rev = function (on) {
      mv.setAttribute("rotation-per-second", on ? "140deg" : "30deg");
      if (on) mv.setAttribute("auto-rotate", "");
      else if (!spinning) mv.removeAttribute("auto-rotate");
      if (gauge) gauge.classList.toggle("is-revving", on);
    };
    throttle.addEventListener("pointerdown", function () { rev(true); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
      throttle.addEventListener(ev, function () { rev(false); });
    });
  }

  /* initial car from ?car= (0..2) */
  var m = location.search.match(/car=([0-9])/);
  applyCar(m ? Math.min(cars.length - 1, +m[1]) : 0);
})();
