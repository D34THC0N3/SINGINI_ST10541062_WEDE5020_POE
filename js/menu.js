// menu. fullscreen overlay, one timeline that plays and reverses
(function () {
  try {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  var btn = document.querySelector(".nav-toggle");
  if (btn) btn.onclick = null;
  if (!btn || getComputedStyle(btn).display === "none") {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-btn";
    btn.innerHTML = "<span></span>MENU";
    var act = document.querySelector(".nav-actions");
    if (act) act.insertBefore(btn, act.firstChild);
    else return;
  }
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "menu-full");
  btn.setAttribute("aria-label", "Open menu");
  btn.setAttribute("data-cursor", "MENU");

  var links = [
    ["index.html", "Home"],
    ["collection.html", "Collection"],
    ["about.html", "About"],
    ["consign.html", "Consign"],
    ["contact.html", "Contact"]
  ];
  var pics = {
    "index.html": "assets/images/alpine-garage.webp",
    "collection.html": "assets/images/m3-gtr.webp",
    "about.html": "assets/images/f1-engine.webp",
    "consign.html": "assets/images/zonda-f-new.webp",
    "contact.html": "assets/images/mclaren-knightsbridge.webp"
  };

  var ov = document.createElement("div");
  ov.className = "menu-full";
  ov.id = "menu-full";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Menu");
  ov.setAttribute("aria-modal", "true");
  ov.hidden = true;
  var inner = '<p class="menu-kicker">MENU ▸ OBSIDIAN MOTORS</p><ul>';
  for (var i = 0; i < links.length; i++) {
    inner += '<li><a href="' + links[i][0] + '" data-pic="' + links[i][0] + '">' +
      '<span class="menu-num">0' + (i + 1) + '</span> ' + links[i][1] + '</a></li>';
  }
  inner += '</ul><p class="menu-foot">-25.7479 28.2293 ▸ ROSEBANK ▸ MON-FRI 08-18, SAT 10-16</p>';
  ov.innerHTML = inner;
  var chaser = document.createElement("img");
  chaser.className = "menu-chaser";
  chaser.alt = "";
  chaser.setAttribute("aria-hidden", "true");
  ov.appendChild(chaser);
  document.body.appendChild(ov);
  var items = ov.querySelectorAll("li a");

  var open = false, busy = false, lastFocus = null, tl = null;
  function buildTl(cx, cy) {
    if (tl) tl.kill();
    tl = gsap.timeline({ paused: true,
      onReverseComplete: function () {
        ov.hidden = true; busy = false; open = false;
        document.body.style.overflow = "";
        document.body.classList.remove("menu-open");
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-label", "Open menu");
        if (lastFocus) lastFocus.focus();
      }
    });
    tl.fromTo(ov,
      { clipPath: "circle(0px at " + cx + "px " + cy + "px)" },
      { clipPath: "circle(160% at " + cx + "px " + cy + "px)", duration: 0.7, ease: "expo.inOut" }, 0);
    tl.fromTo(items, { y: 70, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, ease: "power4.out", stagger: 0.02 }, 0.25);
    tl.fromTo(ov.querySelector(".menu-foot"), { y: 20, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.5, ease: "power4.out" }, 0.4);
    return tl;
  }

  function doOpen() {
    if (open || busy || (tl && tl.isActive())) return;
    busy = true; open = true;
    lastFocus = document.activeElement;
    ov.hidden = false;
    document.body.style.overflow = "hidden";
    document.body.classList.add("menu-open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Close menu");
    ov.setAttribute("data-cursor", "CLOSE");
    if (reduce || !window.gsap) {
      ov.style.clipPath = "none";
      busy = false;
      var a = ov.querySelector("a");
      if (a) a.focus();
      return;
    }
    var r = btn.getBoundingClientRect();
    buildTl(r.left + r.width / 2, r.top + r.height / 2).timeScale(1).play();
    busy = false;
  }
  function doClose(after) {
    if (!open || busy || (tl && tl.isActive())) return;
    busy = true;
    function fin() {
      if (after) after();
    }
    if (reduce || !window.gsap || !tl) {
      ov.hidden = true; busy = false; open = false;
      document.body.style.overflow = "";
      document.body.classList.remove("menu-open");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "Open menu");
      fin();
      return;
    }
    var old = tl.eventCallback("onReverseComplete");
    tl.eventCallback("onReverseComplete", function () {
      if (old) old();
      fin();
    });
    tl.timeScale(1.4).reverse();
  }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (open) doClose(); else doOpen();
  });
  addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") doClose();
    if (e.key === "Tab") {
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // links shut the menu first, shutter runs after
  items.forEach(function (a) {
    a.addEventListener("click", function () { doClose(); });
  });
  // rotating the phone with the menu open just closes it
  var wide = matchMedia("(min-width: 861px)");
  function onBreak(e) { if (open && e.matches) doClose(); }
  if (wide.addEventListener) wide.addEventListener("change", onBreak);

  if (!reduce && !touch) {
    items.forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        items.forEach(function (b) { b.style.opacity = b === a ? "1" : ".3"; });
        var src = pics[a.getAttribute("data-pic")];
        if (src) { chaser.src = src; chaser.classList.add("on"); }
      });
      a.addEventListener("mouseleave", function () {
        items.forEach(function (b) { b.style.opacity = "1"; });
        chaser.classList.remove("on");
      });
    });
    var mx = 0, my = 0, ix = 0, iy = 0, chasing = false;
    ov.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!chasing) { chasing = true; loop(); }
    });
    function loop() {
      if (!open) { chasing = false; return; }
      ix += (mx - ix) * 0.12; iy += (my - iy) * 0.12;
      chaser.style.transform = "translate(" + (ix + 30) + "px," + (iy - 110) + "px)";
      requestAnimationFrame(loop);
    }
  }
  } catch (e) {}
})();
