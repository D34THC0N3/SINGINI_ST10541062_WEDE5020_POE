/* ============================================================
   OBSIDIAN MOTORS — site.js
   Small, dependency-free behaviour shared by every page:
     - scroll progress bar
     - reveal-on-scroll (IntersectionObserver)
     - nav shadow on scroll + mobile menu toggle
     - current year in the footer
     - intro logo reveal (home only, once per tab)
   All of it is progressive: if JS is off, content still shows
   (see the no-JS fallback at the bottom).
   ============================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- current year (footer © line) ---- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- scroll progress bar ---- */
  var bar = document.querySelector(".scroll-progress > i");
  function onScroll() {
    if (bar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
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

  /* ---- intro logo reveal (only if #intro exists; home page) ---- */
  var intro = document.getElementById("intro");
  if (intro) {
    // show once per tab so it doesn't nag on every navigation
    var seen = sessionStorage.getItem("om_intro");
    if (reduce || seen) {
      intro.remove();
      document.body.classList.remove("intro-lock");
    } else {
      document.body.classList.add("intro-lock");
      var done = function () {
        intro.classList.add("is-gone");
        document.body.classList.remove("intro-lock");
        sessionStorage.setItem("om_intro", "1");
        setTimeout(function () { if (intro.parentNode) intro.remove(); }, 900);
      };
      // auto-finish, or let an impatient visitor skip
      var t = setTimeout(done, 2600);
      intro.addEventListener("click", function () { clearTimeout(t); done(); });
    }
  }
  /* ---- home page: hero scrub ---- */
  var hero = document.querySelector(".hero");
  if (hero && !reduce) {
    var tick = function () {
      var span = hero.offsetHeight - window.innerHeight;
      var p = span > 0 ? (window.scrollY - hero.offsetTop) / span : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      hero.style.setProperty("--p", p.toFixed(4));
    };
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    tick();
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

  /* ---- showcase page: model-viewer controls ---- */
  var mv = document.getElementById("mv");
  if (mv) {
    var cars = [
      { name: "Mercedes-AMG GT3", tag: "Track-bred theatre.",            spec: "2019 · Affalterbach · 4.0L twin-turbo V8 · RWD",  orbit: "-30deg 75deg 110%", exposure: "1" },
      { name: "Pagani Zonda",     tag: "Art you can hear.",              spec: "2009 · San Cesario · 7.3L V12 · RWD",             orbit: "25deg 78deg 115%",  exposure: "1.1" },
      { name: "Porsche GT2 RS",   tag: "They called it the widowmaker.", spec: "2018 · Stuttgart · 3.8L twin-turbo flat-6 · RWD", orbit: "-15deg 72deg 105%", exposure: ".95" }
    ];
    var views = { Profile: "-90deg 82deg 105%", Top: "0deg 18deg 125%" };

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
      setActive(viewBtns, viewBtns[0]);
      if (history.replaceState) history.replaceState(null, "", "?car=" + i);
    };
    carBtns.forEach(function (b, i) {
      b.addEventListener("click", function () { applyCar(i); });
    });
    viewBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        mv.setAttribute("camera-orbit", views[b.textContent.trim()] || cars[current].orbit);
        setActive(viewBtns, b);
      });
    });

    var startBtn = document.querySelector(".sc-start");
    var spinning = !reduce;
    if (!spinning) mv.removeAttribute("auto-rotate");
    if (startBtn) {
      var strong = startBtn.querySelector("strong");
      var sync = function () {
        if (strong) strong.textContent = spinning ? "Pause" : "Spin";
        startBtn.setAttribute("aria-pressed", String(spinning));
      };
      sync();
      startBtn.addEventListener("click", function () {
        spinning = !spinning;
        if (spinning) mv.setAttribute("auto-rotate", ""); else mv.removeAttribute("auto-rotate");
        sync();
      });
    }

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

    var m = location.search.match(/car=([0-9])/);
    applyCar(m ? Math.min(cars.length - 1, +m[1]) : 0);
  }

  /* ---- enquiry forms: native validation + inline confirmation ---- */
  // ponytail: no backend — the form validates for real, then confirms inline.
  document.querySelectorAll("form[data-enquiry]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var ok = form.querySelector("[data-ok]");
      form.reset();
      if (ok) { ok.hidden = false; ok.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }); }
    });
  });

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
