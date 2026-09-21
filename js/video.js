// video stuff. one decoder at a time, posters till u scroll close
(function () {
  try {
  window.OM = window.OM || {};
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  var vids = document.querySelectorAll("video");
  // single manager. two decoders max: one ambient bed + one feature clip
  var on = { ambient: null, main: null };
  function group(v) {
    if (v.classList.contains("section-bg") || v.classList.contains("pin-bg") || v.closest(".night-band,.footer-full")) return "ambient";
    return "main";
  }
  window.OM.video = {
    play: function (v) {
      var g = group(v);
      if (on[g] && on[g] !== v) { try { on[g].pause(); } catch (e) {} }
      on[g] = v;
      if (!reduce) { try { v.play().catch(function () {}); } catch (e) {} }
    },
    stop: function (v) {
      try { v.pause(); } catch (e) {}
      if (on[group(v)] === v) on[group(v)] = null;
    }
  };
  if (reduce || !vids.length) return;
  function arm(v) {
    // data-src keeps it light till its nearly on screen
    if (v.getAttribute("data-src") && !v.getAttribute("src")) {
      v.setAttribute("src", v.getAttribute("data-src"));
      v.load();
    }
    v.muted = true; v.loop = true; v.playsInline = true;
    // handoff from a card peek: pick the film up where it left off
    try {
      var hand = JSON.parse(sessionStorage.getItem("om_handoff") || "null");
      if (hand && hand.src && ((v.getAttribute("data-src") || "") === hand.src || (v.currentSrc || "").indexOf(hand.src) !== -1 || (v.getAttribute("src") || "") === hand.src)) {
        v.currentTime = hand.time || 0;
        sessionStorage.removeItem("om_handoff");
      }
    } catch (e) {}
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        arm(v);
        window.OM.video.play(v);
      } else {
        window.OM.video.stop(v);
      }
    });
  }, { rootMargin: "200px" });
  vids.forEach(function (v) {
    if (v.id === "hero-video" || v.id === "grow-vid") arm(v);
    if (!v.getAttribute("poster")) v.setAttribute("poster", "assets/images/alpine-garage.webp");
    io.observe(v);
  });
  // tapes + cards play on hover, cursor already says PLAY
  // tapes also scrub a little with pointer x while hovered
  document.querySelectorAll(".tape, .carousel-card").forEach(function (c) {
    var v = c.querySelector("video");
    if (!v) return;
    c.addEventListener("mouseenter", function () { arm(v); window.OM.video.play(v); });
    c.addEventListener("mouseleave", function () { window.OM.video.stop(v); });
    if (c.classList.contains("tape")) {
      c.addEventListener("pointermove", function (e) {
        if (touch || !v.duration) return;
        var r = c.getBoundingClientRect();
        try { v.currentTime = v.duration * (e.clientX - r.left) / r.width; } catch (err) {}
      });
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      ["ambient", "main"].forEach(function (g) { if (on[g]) { try { on[g].pause(); } catch (e) {} } });
    } else {
      ["ambient", "main"].forEach(function (g) { if (on[g]) { try { on[g].play().catch(function () {}); } catch (e) {} } });
    }
  });
  // tiles shift layout when metadata lands, refresh the triggers (debounced)
  var refreshTimer = null;
  function refresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 250);
  }
  vids.forEach(function (v) { v.addEventListener("loadedmetadata", refresh); });
  addEventListener("load", function () { setTimeout(refresh, 400); });
  } catch (e) {}
})();
