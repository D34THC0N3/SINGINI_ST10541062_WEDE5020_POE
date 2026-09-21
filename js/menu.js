/* menu.js - fullscreen menu that opens from the nav button in a circle */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var btn = document.querySelector(".nav-toggle");
  // take the button over completely, site.js also had a handler and they double-fire
  if (btn) btn.onclick = null;
  // on desktop the burger is hidden, so pop a little MENU chip into the nav
  if (!btn || getComputedStyle(btn).display === "none") {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-btn";
    btn.setAttribute("aria-label", "Open menu");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "MENU";
    var act = document.querySelector(".nav-actions");
    if (act) act.insertBefore(btn, act.firstChild);
    else return;
  }

  // same links as the footer so they never go stale
  var links = [
    ["index.html", "Home"],
    ["collection.html", "Collection"],
    ["about.html", "About"],
    ["consign.html", "Consign"],
    ["contact.html", "Contact"]
  ];
  var pics = {
    "index.html": "assets/images/alpine-garage.webp",
    "collection.html": "assets/images/gt2rs.webp",
    "about.html": "assets/images/still-amg.webp",
    "consign.html": "assets/images/zonda-f.webp",
    "contact.html": "assets/images/mclaren-knightsbridge.webp"
  };

  var ov = document.createElement("div");
  ov.className = "menu-full";
  ov.setAttribute("role", "dialog");
  ov.setAttribute("aria-label", "Menu");
  ov.setAttribute("aria-modal", "true");
  ov.hidden = true;
  var inner = '<p class="menu-kicker">MENU ▸ OBSIDIAN MOTORS</p><ul>';
  for (var i = 0; i < links.length; i++) {
    inner += '<li><a href="' + links[i][0] + '" data-pic="' + links[i][0] + '">' +
      '<span class="menu-num">0' + (i + 1) + '</span> ' + links[i][1] + '</a></li>';
  }
  inner += '</ul><p class="menu-foot">ROSEBANK INTERNATIONAL ▸ PRETORIA ▸ -25.7479 28.2293</p>';
  ov.innerHTML = inner;
  // image that chases the cursor while hovering the links
  var chaser = document.createElement("img");
  chaser.className = "menu-chaser";
  chaser.alt = "";
  chaser.setAttribute("aria-hidden", "true");
  ov.appendChild(chaser);
  document.body.appendChild(ov);

  var open = false, busy = false;
  var touch = matchMedia("(pointer: coarse)").matches;
  var lastFocus = null;

  function doOpen() {
    if (open || busy) return; busy = true; open = true;
    lastFocus = document.activeElement;
    ov.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    ov.setAttribute("data-cursor", "CLOSE");
    var r = btn.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (reduce || !window.gsap) {
      ov.style.clipPath = "none";
      busy = false; focusFirst(); return;
    }
    gsap.fromTo(ov,
      { clipPath: "circle(0px at " + cx + "px " + cy + "px)" },
      { clipPath: "circle(160% at " + cx + "px " + cy + "px)", duration: 0.7, ease: "expo.inOut", onComplete: function () { busy = false; focusFirst(); } });
    // letters hop in
    gsap.fromTo(ov.querySelectorAll("li a"), { y: 70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "power4.out", stagger: 0.05, delay: 0.25 });
  }
  function doClose() {
    if (!open || busy) return; busy = true; open = false;
    btn.setAttribute("aria-expanded", "false");
    var fin = function () { ov.hidden = true; busy = false; if (lastFocus) lastFocus.focus(); };
    if (reduce || !window.gsap) { ov.style.clipPath = ""; fin(); return; }
    gsap.to(ov, { clipPath: "circle(0px at 100% 0%)", duration: 0.5, ease: "expo.inOut", onComplete: fin });
  }
  function focusFirst() { var a = ov.querySelector("a"); if (a) a.focus(); }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (open) doClose(); else doOpen();
  });
  addEventListener("keydown", function (e) {
    if (!open) return;
    if (e.key === "Escape") doClose();
    // keep tab inside while its open
    if (e.key === "Tab") {
      var items = ov.querySelectorAll("a");
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // dim the other links on hover, only on desktop
  if (!reduce && !touch) {
    ov.querySelectorAll("li a").forEach(function (a) {
      a.addEventListener("mouseenter", function () {
        ov.querySelectorAll("li a").forEach(function (b) { b.style.opacity = b === a ? "1" : ".3"; });
        var src = pics[a.getAttribute("data-pic")];
        if (src) { chaser.src = src; chaser.classList.add("on"); }
      });
      a.addEventListener("mouseleave", function () {
        ov.querySelectorAll("li a").forEach(function (b) { b.style.opacity = "1"; });
        chaser.classList.remove("on");
      });
    });
    // picture follows the mouse with a bit of lag
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
})();
