/* ============================================================
   OBSIDIAN MOTORS — site.js
   Small, dependency-free behaviour shared by every page:
     - scroll dots (right side section indicator)
     - reveal-on-scroll (IntersectionObserver)
     - nav shadow on scroll + mobile menu toggle
     - current year in the footer
     - intro logo reveal (home only, once per tab)
     - page fade transitions
   All of it is progressive: if JS is off, content still shows
   (see the no-JS fallback at the bottom).
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- current year (footer © line) ---- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- scroll dots (right side) ---- */
  var dots = document.querySelector(".scroll-dots");
  if (dots) {
    var secs = document.querySelectorAll("main section, .hero");
    secs.forEach(function (sec) {
      var a = document.createElement("a");
      a.href = "#";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      });
      dots.appendChild(a);
    });
    var dotLinks = dots.querySelectorAll("a");
    var setDot = function () {
      var mid = window.scrollY + window.innerHeight / 2;
      var on = 0;
      secs.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top + window.scrollY <= mid) on = i;
      });
      dotLinks.forEach(function (a, i) { a.classList.toggle("is-on", i === on); });
    };
    window.addEventListener("scroll", setDot, { passive: true });
    setDot();
  }
  function onScroll() {
    var nav = document.querySelector(".nav");
    if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- reveal on scroll ---- */
  var targets = document.querySelectorAll(".section, .reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    // no animation wanted (or supported) — just show everything
    targets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---- mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.closest(".nav").classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close after picking a link (single-page feel)
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("is-open");
        toggle.closest(".nav").classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- intro logo reveal (only if #intro exists; home page) ----
     Cinematic beats: crystal glints (~1.3s) → wordmark rises
     (~1.7s) → gold rule draws (~2.1s) → hold → fade to black →
     hero. Once per tab; a click skips it. */
  var intro = document.getElementById("intro");
  if (intro) {
    var seen = sessionStorage.getItem("om_intro");
    if (reduce || seen) {
      intro.remove();
      document.body.classList.remove("intro-lock");
    } else {
      document.body.classList.add("intro-lock");
      var done = function () {
        intro.classList.add("is-fade");          // the fade to black
        setTimeout(function () { intro.classList.add("is-gone"); }, 1000);
        document.body.classList.remove("intro-lock");
        sessionStorage.setItem("om_intro", "1");
        setTimeout(function () { if (intro.parentNode) intro.remove(); }, 2100);
      };
      var t = setTimeout(done, 3000);
      intro.addEventListener("click", function () { clearTimeout(t); done(); });
    }
  }

  var runCount = function (el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var start = null, dur = 1200;
    var frame = function (t) {
      if (start === null) start = t;
      var k = Math.min((t - start) / dur, 1);
      k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * k) + suffix;
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  var figs = document.querySelectorAll("[data-count]");
  if (figs.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      figs.forEach(runCount);
    } else {
      var ioCount = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runCount(e.target); ioCount.unobserve(e.target); }
        });
      }, { threshold: 0.5 });
      figs.forEach(function (el) { ioCount.observe(el); });
    }
  }

  /* ---- page transitions ---- */
  var fade = document.getElementById("page-fade");
  if (fade) {
    fade.classList.add("is-loaded");
    document.querySelectorAll('a[href$=".html"], a[href$="/"]').forEach(function (a) {
      if (a.hostname && a.hostname !== location.hostname) return;
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (a.getAttribute("target") === "_blank") return;
        e.preventDefault();
        fade.classList.add("is-leaving");
        setTimeout(function () { location.href = a.href; }, 300);
      });
    });
  }
})();
