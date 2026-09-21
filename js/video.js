/* video.js. only plays vids u can see, pauses the rest */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var vids = document.querySelectorAll("video");
  if (!vids.length) return;
  // load vids late
  var active = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        v.preload = "auto";
        if (active && active !== v) { active.pause(); }
        active = v;
        v.play().catch(function () {});
      } else {
        v.pause();
        if (active === v) active = null;
      }
    });
  }, { rootMargin: "200px" });
  vids.forEach(function (v) {
    v.muted = true; v.loop = true; v.playsInline = true;
    // hero loads straight away, the rest wait till theyre close
    if (v.id === "hero-video" || v.id === "grow-vid") v.setAttribute("preload", "auto");
    else v.setAttribute("preload", "none");
    if (!v.getAttribute("poster")) v.setAttribute("poster", "assets/images/alpine-garage.webp");
    io.observe(v);
  });
  // pause when the tab is hidden
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && active) active.pause();
    else if (!document.hidden && active) active.play().catch(function () {});
  });
  // play on hover for the car cards
  document.querySelectorAll(".carousel-card").forEach(function (c) {
    var v = c.querySelector("video");
    if (!v) return;
    // the html already says PLAY so the circle picks it up
    c.addEventListener("mouseenter", function () { if (active && active !== v) active.pause(); active = v; v.play().catch(function () {}); });
    c.addEventListener("mouseleave", function () { v.pause(); });
  });
})();
