/* Obsidian Motors — site behaviour. Plain JS, no build step. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // page fade — lift the black on load, drop it again when leaving
  var fade = document.getElementById("page-fade");
  if (fade) {
    requestAnimationFrame(function () { fade.classList.add("is-loaded"); });
    addEventListener("pageshow", function () { fade.classList.add("is-loaded"); });
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || reduce) return;
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

  // nav — solid bar, just tracks scroll state
  var nav = document.querySelector(".nav");
  addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 4);
  }, { passive: true });

  // mobile menu
  var tog = document.querySelector(".nav-toggle"),
    links = document.querySelector(".nav-links");
  if (tog && links) {
    tog.onclick = function () {
      var open = links.classList.toggle("is-open");
      nav.classList.toggle("is-open", open);
      tog.setAttribute("aria-expanded", open);
    };
  }

  // scroll reveals
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

  // only run videos while they are on screen — saves battery and heat
  var vids = document.querySelectorAll("video");
  if ("IntersectionObserver" in window && vids.length) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (v.paused) v.play().catch(function () {}); }
        else { if (!v.paused) v.pause(); }
      });
    }, { threshold: 0.05 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  // intro — brand reveal on load, click skips, gone afterwards
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

  // hero — scroll scrubs the film and leans the frame slightly
  var hv = document.getElementById("hero-video");
  var hero = document.getElementById("hero");
  if (hv && hero && !reduce) {
    hv.muted = true; hv.playsInline = true;
    hv.play().catch(function () {});
    addEventListener("scroll", function () {
      var p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
      if (hv.duration) hv.currentTime = p * hv.duration * 0.92;
      hv.style.transform = "scale(" + (1 + p * 0.08) + ") translateY(" + p * -14 + "px)";
      hv.style.filter = "brightness(" + (0.9 - p * 0.18) + ") saturate(" + (0.9 + p * 0.1) + ")";
    }, { passive: true });
  }

  // grow cut — the vertical clip beside the copy expands as you pass it
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

  // film break — the pinned section breathes with a slow zoom
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
