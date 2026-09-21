/* cursor - ring + dot, states via data-cursor */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || matchMedia("(pointer:coarse)").matches) return;
  var ring = document.createElement("div");
  ring.id = "om-cursor";
  var dot = document.createElement("div");
  dot.id = "om-cursor-dot";
  var label = document.createElement("span");
  label.id = "om-cursor-label";
  ring.appendChild(label);
  document.documentElement.appendChild(ring);
  document.documentElement.appendChild(dot);
  var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, dx = mx, dy = my;
  var ringScale = 1, targetScale = 1;
  var active = false;
  addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; if (!active) { active = true; ring.classList.add("on"); dot.classList.add("on"); } });
  addEventListener("mouseleave", function () { active = false; ring.classList.remove("on"); dot.classList.remove("on"); });
  function loop() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    dx += (mx - dx) * 0.32;
    dy += (my - dy) * 0.32;
    ringScale += (targetScale - ringScale) * 0.18;
    ring.style.transform = "translate(" + (rx - 17) + "px," + (ry - 17) + "px) scale(" + ringScale + ")";
    dot.style.transform = "translate(" + (dx - 2) + "px," + (dy - 2) + "px)";
    requestAnimationFrame(loop);
  }
  loop();
  // words that show in the circle, circle gets bigger
  document.addEventListener("mouseover", function (e) {
    // sometimes theres nothing there so check first or it breaks lol
    if (!e.target || !e.target.closest) return;
    var el = e.target.closest("[data-cursor]");
    if (el) {
      label.textContent = el.getAttribute("data-cursor");
      label.style.opacity = "1";
      targetScale = 1.6;
    }
  });
  document.addEventListener("mouseout", function (e) {
    if (!e.target || !e.target.closest) return;
    var el = e.target.closest("[data-cursor]");
    if (el) { label.style.opacity = "0"; targetScale = 1; }
  });
  // buttons lean towards ur mouse a tiny bit
  document.querySelectorAll(".btn, .btn-outline, .nav-cta, .nav-links a").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = (e.clientX - cx) * 0.12, dy = (e.clientY - cy) * 0.12;
      dx = Math.max(-8, Math.min(8, dx)); dy = Math.max(-8, Math.min(8, dy));
      el.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
    el.addEventListener("mouseleave", function () { el.style.transform = ""; });
  });
  // hide it on text boxes
  document.addEventListener("mouseenter", function (e) {
    // same check or it errors
    if (e.target && e.target.matches && e.target.matches("input, textarea, select")) { ring.style.opacity = "0"; dot.style.opacity = "0"; }
  }, true);
  document.addEventListener("mouseleave", function (e) {
    if (e.target && e.target.matches && e.target.matches("input, textarea, select")) { ring.style.opacity = ""; dot.style.opacity = ""; }
  }, true);
  // only hide the normal cursor on mouse, not touch
  document.documentElement.style.cursor = "none";
})();
