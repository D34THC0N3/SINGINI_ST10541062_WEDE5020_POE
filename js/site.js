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
})();
