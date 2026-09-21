/* obsidian - video.js. one decoder at a time, lazy, poster, pause off-screen */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  var vids = document.querySelectorAll("video");
  if (!vids.length) return;
  // lazy via IntersectionObserver
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
    v.setAttribute("preload", "none");
    if (!v.getAttribute("poster")) v.setAttribute("poster", "assets/images/alpine-garage.webp");
    io.observe(v);
  });
  // single decoder: pause on hidden
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && active) active.pause();
    else if (!document.hidden && active) active.play().catch(function () {});
  });
  // hover play for carousel cards (cursor PLAY)
  document.querySelectorAll(".carousel-card").forEach(function (c) {
    var v = c.querySelector("video");
    if (!v) return;
    // card already carries data-cursor="PLAY" in the html so the ring picks it up in time
    c.addEventListener("mouseenter", function () { if (active && active !== v) active.pause(); active = v; v.play().catch(function () {}); });
    c.addEventListener("mouseleave", function () { v.pause(); });
  });
})();
