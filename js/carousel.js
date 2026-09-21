/* carousel + heat meter + peek. drag / wheel / keyboard, snap to card */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wrap = document.querySelector(".carousel");
  if (!wrap) return;
  if (reduce) return; // fallback grid via css noscript
  var cards = wrap.querySelectorAll(".carousel-card");
  if (!cards.length) return;
  var heat = document.querySelector(".heat-fill");
  var label = document.querySelector(".heat-label");
  var x = 0, maxX = 0, startX = 0, curX = 0, isDrag = false, vel = 0, lastX = 0;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function updateMax() {
    maxX = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
  }
  updateMax();
  addEventListener("resize", updateMax);
  function render() {
    wrap.scrollLeft = x;
    // skew + scale
    var skew = clamp(vel * 0.08, -3, 3);
    cards.forEach(function (c) { c.style.transform = "skewX(" + skew + "deg) scale(" + (Math.abs(skew) > 1 ? 0.98 : 1) + ")"; });
    if (heat) heat.style.width = (maxX ? (x / maxX * 100) : 0) + "%";
    if (label) label.textContent = "HEAT " + String(Math.round(maxX ? (x / maxX * 3) + 1 : 1)).padStart(2, "0") + "/04";
  }
  // drag
  wrap.addEventListener("pointerdown", function (e) { isDrag = true; startX = e.clientX; curX = x; wrap.setPointerCapture(e.pointerId); document.documentElement.classList.add("dragging"); });
  addEventListener("pointermove", function (e) {
    if (!isDrag) return;
    var dx = e.clientX - startX;
    var nx = curX - dx;
    vel = nx - x;
    x = clamp(nx, 0, maxX);
    render();
  });
  var endDrag = function () { if (isDrag) { isDrag = false; document.documentElement.classList.remove("dragging"); snap(); } };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);
  // wheel
  wrap.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    e.preventDefault();
    vel = e.deltaY * 0.4;
    x = clamp(x + vel, 0, maxX);
    render();
  }, { passive: false });
  // keyboard
  wrap.setAttribute("tabindex", "0");
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-roledescription", "carousel");
  wrap.setAttribute("aria-label", "Collection carousel");
  wrap.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { x = clamp(x + 360, 0, maxX); render(); snap(); }
    if (e.key === "ArrowLeft") { x = clamp(x - 360, 0, maxX); render(); snap(); }
  });
  function snap() {
    // snap to nearest card
    var best = 0, bestD = Infinity;
    cards.forEach(function (c) {
      var d = Math.abs(c.offsetLeft - x);
      if (d < bestD) { bestD = d; best = c.offsetLeft; }
    });
    if (window.gsap) gsap.to({ v: x }, { v: best, duration: 0.6, ease: "power3.out", onUpdate: function () { x = this.targets()[0].v; render(); } });
    else { x = best; render(); }
  }
  // peek — hover a card for 3s and the lights dim, card blows up to near-fullscreen
  var dim = document.createElement("div");
  dim.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);opacity:0;transition:opacity .35s;z-index:7990;pointer-events:none";
  document.body.appendChild(dim);
  var openCard = null;
  function closePeek() {
    if (!openCard) return;
    var card = openCard; openCard = null;
    dim.style.opacity = "0";
    var cue = card.querySelector(".peek-cue");
    if (cue) cue.remove();
    card.style.position = ""; card.style.left = ""; card.style.top = ""; card.style.width = ""; card.style.height = ""; card.style.transform = ""; card.style.zIndex = "";
    document.body.style.overflow = "";
  }
  addEventListener("keydown", function (e) { if (e.key === "Escape") closePeek(); });
  dim.addEventListener("click", closePeek);
  cards.forEach(function (card) {
    var timer = null;
    card.addEventListener("mouseenter", function () {
      timer = setTimeout(function () {
        openCard = card;
        dim.style.opacity = "1";
        card.style.position = "fixed";
        card.style.left = "50%"; card.style.top = "50%";
        card.style.width = "85vw"; card.style.height = "80vh";
        card.style.transform = "translate(-50%,-50%)";
        card.style.zIndex = "8000";
        document.body.style.overflow = "hidden";
        card.setAttribute("data-cursor", "CLOSE");
        // dossier cue, no showcase page so it points at the contact flow
        var cue = document.createElement("span");
        cue.className = "peek-cue";
        cue.textContent = "Open the dossier →";
        card.appendChild(cue);
      }, 3000);
    });
    card.addEventListener("mouseleave", function () {
      clearTimeout(timer);
      if (openCard === card) closePeek();
    });
  });
  // GSAP Observer if available for smoother
  if (window.gsap && window.Observer) {
    gsap.registerPlugin(Observer);
    Observer.create({ target: wrap, type: "pointer,touch", onDrag: function (self) { vel = self.deltaX; x = clamp(x - self.deltaX, 0, maxX); render(); } });
  }
  render();
})();
