/* obsidian — bare minimum js, no fluff */
// ponytail: kept nav, intro, reveal, year. dots/counters/page-fade = bloat, nuked.
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // year — yo, its 2026
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  // nav — solid, not that see-through ai nonsense
  var nav = document.querySelector(".nav");
  addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 4);
  }, { passive: true });

  // mobile menu — tap to open, tap to close, thats it
  var tog = document.querySelector(".nav-toggle"),
    links = document.querySelector(".nav-links");
  if (tog && links) {
    tog.onclick = function () {
      var open = links.classList.toggle("is-open");
      nav.classList.toggle("is-open", open);
      tog.setAttribute("aria-expanded", open);
    };
  }

  // reveal — if ya scroll, it shows. respects reduced motion
  var els = document.querySelectorAll(".reveal, .section");
  if (reduce || !("IntersectionObserver" in window)) {
    els.forEach(function (e) { e.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.14 });
    els.forEach(function (e) { io.observe(e); });
  }

  // intro — black reveal every time ya hit index, pure cinema
  var intro = document.getElementById("intro");
  if (intro) {
    if (reduce) { intro.remove(); }
    else {
      document.body.classList.add("intro-lock");
      var kill = function () {
        intro.classList.add("is-fade");
        setTimeout(function () { intro.remove(); document.body.classList.remove("intro-lock"); }, 1000);
      };
      var t = setTimeout(kill, 2800);
      intro.addEventListener("click", function () { clearTimeout(t); kill(); });
    }
  }

  // hero video scrub — scroll drives the vid, parallax-ish
  // ponytail: one vid, one handler, no lib
  var hv = document.getElementById("hero-video");
  var hero = document.getElementById("hero");
  if (hv && hero && !reduce) {
    hv.muted = true; hv.playsInline = true;
    // try autoplay, if blocked just wait for scroll
    hv.play().catch(function () {});
    addEventListener("scroll", function () {
      var p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
      // scrub time if metadata ready
      if (hv.duration) hv.currentTime = p * hv.duration * 0.92;
      // parallax + fade
      hv.style.transform = "scale(" + (1 + p * 0.08) + ") translateY(" + p * -14 + "px)";
      hv.style.filter = "brightness(" + (0.9 - p * 0.18) + ") saturate(" + (0.9 + p * 0.1) + ")";
    }, { passive: true });
  }

  // grow vid — text left, vid right, then vid eats the screen
  var grow = document.getElementById("grow-vid");
  var growSec = document.getElementById("grow-sec");
  if (grow && growSec && !reduce) {
    addEventListener("scroll", function () {
      var r = growSec.getBoundingClientRect();
      var prog = 1 - Math.min(1, Math.max(0, r.bottom / innerHeight));
      // 0 = not yet, 1 = past
      grow.style.transform = "scale(" + (1 + prog * 0.38) + ")";
      grow.style.borderRadius = prog > 0.55 ? "0px" : "var(--radius)";
    }, { passive: true });
  }
})();
