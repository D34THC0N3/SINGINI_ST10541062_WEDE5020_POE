/* Obsidian Motors — site behaviour. Plain JS, no build step. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // fade in on load, fade out when leaving
  var fade = document.getElementById("page-fade");
  if (fade) {
    requestAnimationFrame(function () { fade.classList.add("is-loaded"); });
    addEventListener("pageshow", function () { fade.classList.add("is-loaded"); });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || reduce) return;
      // skip this if the page door is handling it or they clash lol
      if (window.OMTransition) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target || /\.(jpe?g|png|webp|mp4|webm)$/i.test(href)) return;
      e.preventDefault();
      fade.classList.remove("is-loaded");
      fade.classList.add("is-leaving");
      setTimeout(function () { location.href = href; }, 300);
    });
  }

  // footer year
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  // nav just changes a bit on scroll
  var nav = document.querySelector(".nav");
  addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 4);
  }, { passive: true });

  // phone menu
  var tog = document.querySelector(".nav-toggle"),
    links = document.querySelector(".nav-links");
  if (tog && links) {
    tog.onclick = function () {
      var open = links.classList.toggle("is-open");
      nav.classList.toggle("is-open", open);
      tog.setAttribute("aria-expanded", open);
    };
  }

  // fade stuff in on scroll
  // motion.js already does this with gsap when it can, so dont double up
  var els = document.querySelectorAll(".reveal, .section");
  var gsapOwnsIt = !reduce && window.gsap && window.ScrollTrigger;
  if (reduce || !("IntersectionObserver" in window) || gsapOwnsIt) {
    if (!gsapOwnsIt) els.forEach(function (e) { e.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14 });
    els.forEach(function (e) { io.observe(e); });
  }

  // vids are handled in video.js (one decoder at a time) so dont double-play them here

  // intro lives in intro.js now, it owns the #intro box + heroIn timing

  // big video zooms a tiny bit when u scroll, no scrubbing cos it makes it stutter
  var hv = document.getElementById("hero-video");
  var hero = document.getElementById("hero");
  if (hv && hero && !reduce) {
    hv.muted = true; hv.playsInline = true;
    hv.play().catch(function () {});
    var tick = false;
    addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
        hv.style.transform = "scale(" + (1 + p * 0.08) + ") translateY(" + p * -14 + "px)";
        hv.style.filter = "brightness(" + (0.9 - p * 0.18) + ") saturate(" + (0.9 + p * 0.1) + ")";
      });
    }, { passive: true });
  }

  // side video gets bigger as u scroll past
  var grow = document.getElementById("grow-vid");
  var growSec = document.getElementById("grow-sec");
  if (grow && growSec && !reduce) {
    addEventListener("scroll", function () {
      var r = growSec.getBoundingClientRect();
      var prog = 1 - Math.min(1, Math.max(0, r.bottom / innerHeight));
      grow.style.transform = "scale(" + (1 + prog * 0.38) + ")";
      grow.style.borderRadius = prog > 0.55 ? "0px" : "var(--radius)";
    }, { passive: true });
  }

  // middle video zooms slow on scroll
  var bvid = document.querySelector("[data-break-vid]");
  var bsec = document.getElementById("break");
  if (bvid && bsec && !reduce) {
    addEventListener("scroll", function () {
      var r = bsec.getBoundingClientRect();
      var prog = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight || 1)));
      bvid.style.transform = "scale(" + (1.05 + prog * 0.15) + ")";
    }, { passive: true });
  }
})();
