/* carousel + heat meter + peek. drag / wheel / keyboard, snap to card */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wrap = document.querySelector(".carousel");
  if (!wrap) return;
  if (reduce) return; // plain grid if js is off
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
    // tilt a bit when moving fast, skip the blown up one
    var skew = clamp(vel * 0.08, -3, 3);
    cards.forEach(function (c) {
      if (c.style.position === "fixed") return; // peek is open, leave it alone
      c.style.transform = "skewX(" + skew + "deg) scale(" + (Math.abs(skew) > 1 ? 0.98 : 1) + ")";
    });
    if (heat) heat.style.width = (maxX ? (x / maxX * 100) : 0) + "%";
    if (label) label.textContent = "HEAT " + String(Math.round(maxX ? (x / maxX * 3) + 1 : 1)).padStart(2, "0") + "/04";
  }
  // dragging - skip this if Observer is doing it or they fight and it goes 2x speed lol
  var useObserver = !!(window.gsap && window.Observer);
  wrap.addEventListener("pointerdown", function (e) { if (useObserver) return; isDrag = true; startX = e.clientX; curX = x; try { wrap.setPointerCapture(e.pointerId); } catch (err) {} document.documentElement.classList.add("dragging"); });
  addEventListener("pointermove", function (e) {
    if (!isDrag || useObserver) return;
    var dx = e.clientX - startX;
    var nx = curX - dx;
    vel = nx - x;
    x = clamp(nx, 0, maxX);
    render();
  });
  var endDrag = function () { if (isDrag) { isDrag = false; document.documentElement.classList.remove("dragging"); snap(); } };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);
  // mouse wheel
  wrap.addEventListener("wheel", function (e) {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    // at the edges let the page have the scroll so nobody gets trapped
    if ((e.deltaY > 0 && x >= maxX) || (e.deltaY < 0 && x <= 0)) return;
    e.preventDefault();
    vel = e.deltaY * 0.4;
    x = clamp(x + vel, 0, maxX);
    render();
  }, { passive: false });
  // arrow keys
  wrap.setAttribute("tabindex", "0");
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-roledescription", "carousel");
  wrap.setAttribute("aria-label", "Collection carousel");
  wrap.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { x = clamp(x + 360, 0, maxX); render(); snap(); }
    if (e.key === "ArrowLeft") { x = clamp(x - 360, 0, maxX); render(); snap(); }
  });
  var snapTween = null;
  function snap() {
    // line up with the closest card
    var best = 0, bestD = Infinity;
    cards.forEach(function (c) {
      var d = Math.abs(c.offsetLeft - x);
      if (d < bestD) { bestD = d; best = c.offsetLeft; }
    });
    if (snapTween && snapTween.kill) snapTween.kill();
    if (window.gsap) {
      var o = { v: x };
      snapTween = gsap.to(o, { v: best, duration: 0.6, ease: "power3.out", overwrite: true, onUpdate: function () { x = o.v; vel *= 0.8; render(); } });
    }
    else { x = best; render(); }
  }
  // hold ur mouse on a card for 3 sec and it blows up big
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
  // radial ring around the cursor while u hold, 3 sec then it opens
  // click also opens it right away cos waiting 3 sec is annoying lol
  var ring = document.createElement("div");
  ring.className = "peek-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.innerHTML = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="pr-track"/><circle cx="20" cy="20" r="17" class="pr-fill"/></svg>';
  document.body.appendChild(ring);
  var RC = 2 * Math.PI * 17;
  var ringFill = ring.querySelector(".pr-fill");
  ringFill.style.strokeDasharray = RC;
  ringFill.style.strokeDashoffset = RC;

  function openPeek(card) {
    if (openCard) return;
    openCard = card;
    ring.classList.remove("on");
    dim.style.opacity = "1";
    card.style.position = "fixed";
    card.style.left = "50%"; card.style.top = "50%";
    card.style.width = "85vw"; card.style.height = "80vh";
    card.style.transform = "translate(-50%,-50%)";
    card.style.zIndex = "8000";
    document.body.style.overflow = "hidden";
    card.setAttribute("data-cursor", "CLOSE");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    // little tag that says open it
    var cue = document.createElement("span");
    cue.className = "peek-cue";
    cue.textContent = "Open the dossier →";
    card.appendChild(cue);
  }
  cards.forEach(function (card) {
    var timer = null, ringTween = null;
    card.setAttribute("data-cursor", card.getAttribute("data-cursor") || "VIEW");
    // persistent corner tick so u know it opens, found this the hard way
    var tick = document.createElement("span");
    tick.className = "peek-tick";
    tick.setAttribute("aria-hidden", "true");
    tick.textContent = "EXPAND";
    card.appendChild(tick);
    card.addEventListener("mouseenter", function () {
      timer = setTimeout(function () { openPeek(card); }, 3000);
      // ring fills over the 3 sec so u know something is coming
      ring.classList.add("on");
      if (window.gsap) ringTween = gsap.fromTo(ringFill, { strokeDashoffset: RC }, { strokeDashoffset: 0, duration: 3, ease: "none" });
      var sp = card.querySelector(".peek-tick");
      if (sp) sp.textContent = "KEEP HOLDING ▸";
    });
    card.addEventListener("mousemove", function (e) {
      ring.style.transform = "translate(" + (e.clientX - 20) + "px," + (e.clientY - 20) + "px)";
    });
    card.addEventListener("mouseleave", function () {
      clearTimeout(timer);
      if (ringTween) ringTween.kill();
      ring.classList.remove("on");
      var sp = card.querySelector(".peek-tick");
      if (sp) sp.textContent = "EXPAND";
      if (openCard === card) closePeek();
    });
    // tapping/clicking opens it now, no waiting
    card.addEventListener("click", function (e) {
      if (openCard) return; // already open, let the link work
      e.preventDefault();
      clearTimeout(timer);
      openPeek(card);
    });
  });
  // smoother dragging if gsap is loaded
  if (useObserver) {
    gsap.registerPlugin(Observer);
    Observer.create({ target: wrap, type: "pointer,touch", onDrag: function (self) { vel = -self.deltaX; x = clamp(x - self.deltaX, 0, maxX); render(); }, onDragEnd: function () { snap(); } });
  }
  render();
})();
