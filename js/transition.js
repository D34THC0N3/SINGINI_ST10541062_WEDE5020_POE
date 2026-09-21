/* page door. click a link, door shuts, new page, door opens. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  // each page gets its own door number lol
  var gates = {
    "index.html": "GATE 01",
    "collection.html": "GATE 02",
    "about.html": "GATE 03",
    "consign.html": "GATE 04",
    "contact.html": "GATE 05",
    "privacy.html": "GATE 06",
    "terms.html": "GATE 06",
    "404.html": "GATE 00"
  };
  function gateFor(href) {
    var p;
    try { p = new URL(href, location.href).pathname.split("/").pop() || "index.html"; }
    catch (e) { p = "index.html"; }
    return gates[p] || "GATE 01";
  }

  // build the door once: bars + text + flash
  var overlay = document.createElement("div");
  overlay.id = "gate";
  overlay.hidden = true;
  overlay.style.cssText = "position:fixed;inset:0;z-index:9000;background:#070707;overflow:hidden";

  var flash = document.createElement("div"); // quick white flash
  flash.style.cssText = "position:absolute;inset:0;background:#f5ebdc;opacity:0;pointer-events:none;mix-blend-mode:screen";

  var slats = document.createElement("div");
  slats.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column";
  var seed = Math.random(); // random wobble so its never exactly the same
  for (var i = 0; i < 14; i++) {
    var s = document.createElement("i");
    var jit = (Math.sin(seed * 99 + i * 7) * 0.008);
    s.style.cssText = "flex:1;background:#0d0d0d;border-top:1px solid rgba(184,151,106,.14);border-bottom:1px solid rgba(0,0,0,.9);transform:translateY(-100%);";
    s.dataset.delay = (i * 0.02 + jit).toFixed(3);
    slats.appendChild(s);
  }

  var hud = document.createElement("div");
  hud.style.cssText = "position:absolute;top:18px;left:18px;font:10px 'IBM Plex Mono',monospace;letter-spacing:.14em;color:#b8976a;opacity:0";
  hud.textContent = "GATE 01 ▸ CLOSING ▸ 100%";

  // gold glow on the edge
  var bloom = document.createElement("div");
  bloom.style.cssText = "position:absolute;left:0;right:0;height:90px;top:100%;background:linear-gradient(to top, rgba(184,151,106,.25), transparent);opacity:0";

  // quick glitch lines at full black
  var scan = document.createElement("div");
  scan.style.cssText = "position:absolute;inset:0;background:repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,.55) 2px 4px);opacity:0;pointer-events:none";

  // text types itself out
  var typeTimer = null;
  function typeHud(text) {
    if (typeTimer) clearInterval(typeTimer);
    var i = 0;
    hud.textContent = "";
    typeTimer = setInterval(function () {
      hud.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typeTimer);
    }, 14);
  }

  overlay.appendChild(slats);
  overlay.appendChild(flash);
  overlay.appendChild(hud);
  overlay.appendChild(bloom);
  overlay.appendChild(scan);
  document.documentElement.appendChild(overlay);

  var busy = false;
  function closeAndGo(href) {
    if (busy) return;
    busy = true;
    overlay.hidden = false;
    typeHud(gateFor(href) + " ▸ CLOSING ▸ 100%");
    overlay.offsetHeight;
    // flash first, then the door moves
    flash.style.transition = "opacity .12s linear";
    flash.style.opacity = "1";
    setTimeout(function () { flash.style.opacity = "0"; }, 130);
    setTimeout(function () {
      Array.prototype.forEach.call(slats.childNodes, function (el) {
        el.style.transition = "transform .55s cubic-bezier(.76,0,.24,1) " + el.dataset.delay + "s";
        el.style.transform = "translateY(0)";
      });
      hud.style.transition = "opacity .2s";
      hud.style.opacity = "1";
    }, 150);
    setTimeout(function () { scan.style.opacity = "1"; }, 800);
    setTimeout(function () { scan.style.opacity = "0"; }, 870);
    setTimeout(function () {
      try { sessionStorage.setItem("om_transition", "open"); } catch (e) {}
      location.href = href;
    }, 950);
    // absolute backup, if the anim jams just go anyway
    setTimeout(function () {
      try { sessionStorage.setItem("om_transition", "open"); } catch (e) {}
      location.href = href;
    }, 1500);
  }

  document.addEventListener("click", function (e) {
    if (!e.target || !e.target.closest) return;
    // let new-tab clicks and right/middle clicks do their normal thing
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button !== undefined && e.button !== 0)) return;
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (a.target === "_blank" || a.hostname !== location.hostname) return;
    if (href.startsWith("http") && new URL(href, location.href).origin !== location.origin) return;
    if (new URL(a.href).pathname === location.pathname && new URL(a.href).search === location.search) return;
    e.preventDefault();
    // cards with a film expand it fullscreen first, then the shutter takes over
    var cardVid = a.querySelector("video");
    if (cardVid && window.gsap && !reduce) {
      e.preventDefault();
      if (busy) return;
      busy = true;
      try {
        var vsrc = cardVid.getAttribute("data-src") || cardVid.currentSrc || cardVid.getAttribute("src");
        sessionStorage.setItem("om_handoff", JSON.stringify({ src: vsrc, time: cardVid.currentTime || 0 }));
      } catch (err) {}
      var r = a.getBoundingClientRect();
      var ghost = document.createElement("div");
      ghost.setAttribute("aria-hidden", "true");
      ghost.style.cssText = "position:fixed;z-index:8900;pointer-events:none;background:#000;overflow:hidden;" +
        "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      var gv = document.createElement("video");
      gv.muted = true; gv.loop = true; gv.playsInline = true;
      gv.poster = cardVid.poster || "";
      if (cardVid.getAttribute("src")) gv.src = cardVid.getAttribute("src");
      gv.style.cssText = "width:100%;height:100%;object-fit:cover";
      ghost.appendChild(gv);
      document.body.appendChild(ghost);
      try { gv.play().catch(function () {}); } catch (err) {}
      gsap.to(ghost, { left: 0, top: 0, width: innerWidth, height: innerHeight,
        duration: 0.7, ease: "expo.inOut", onComplete: function () { busy = false; closeAndGo(a.href); } });
      return;
    }
    closeAndGo(a.href);
  });

  // new page: door opens back up
  addEventListener("pageshow", function (ev) {
    // head script hid the body so the shut door never flashes, show it now
    document.documentElement.classList.remove("gate-closed");
    // back button restores the shut door from cache, force it open
    if (ev && ev.persisted) {
      try { sessionStorage.removeItem("om_transition"); } catch (e) {}
      Array.prototype.forEach.call(slats.childNodes, function (el) {
        el.style.transition = "none";
        el.style.transform = "translateY(-100%)";
      });
      overlay.hidden = true; busy = false;
      if (window.OMMotion && window.OMMotion.heroIn) window.OMMotion.heroIn();
      return;
    }
    var flag = null;
    try { flag = sessionStorage.getItem("om_transition"); } catch (e) {}
    if (flag !== "open") return;
    try { sessionStorage.removeItem("om_transition"); } catch (e) {}
    overlay.hidden = false;
    hud.textContent = gateFor(location.href) + " ▸ OPEN";
    Array.prototype.forEach.call(slats.childNodes, function (el) {
      el.style.transition = "none";
      el.style.transform = "translateY(0)";
    });
    hud.style.opacity = "1";
    bloom.style.opacity = "1";
    overlay.offsetHeight; // make sure the browser draws it shut first
    requestAnimationFrame(function () {
      Array.prototype.forEach.call(slats.childNodes, function (el, i) {
        el.style.transition = "transform .7s cubic-bezier(.16,1,.3,1) " + (i * 0.015) + "s";
        el.style.transform = "translateY(-100%)";
      });
      bloom.style.transition = "top .7s cubic-bezier(.16,1,.3,1), opacity .5s";
      bloom.style.top = "-90px";
      hud.style.opacity = "0";
      // tiny nudge at the end
      var main = document.querySelector("main") || document.body;
      main.style.transform = "translateY(2px)";
      setTimeout(function () {
        main.style.transition = "transform .3s cubic-bezier(.22,1,.36,1)";
        main.style.transform = "translateY(0)";
      }, 30);
      setTimeout(function () {
        bloom.style.opacity = "0";
        bloom.style.top = "100%";
      }, 800);
      setTimeout(function () { if (window.OMMotion && window.OMMotion.heroIn) window.OMMotion.heroIn(); }, 180);
    });
    setTimeout(function () { overlay.hidden = true; busy = false; }, 950);
  });

  window.OMTransition = { overlay: overlay };

  // shared gate so the intro can lift the same door into the hero
  window.OM = window.OM || {};
  window.OM.gate = {
    close: function (href) { closeAndGo(href); },
    open: function () {
      overlay.hidden = false;
      hud.textContent = gateFor(location.href) + " ▸ OPEN";
      Array.prototype.forEach.call(slats.childNodes, function (el) {
        el.style.transition = "none";
        el.style.transform = "translateY(0)";
      });
      hud.style.opacity = "1";
      bloom.style.opacity = "1";
      overlay.offsetHeight;
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(slats.childNodes, function (el, i) {
          el.style.transition = "transform .7s cubic-bezier(.16,1,.3,1) " + (i * 0.015) + "s";
          el.style.transform = "translateY(-100%)";
        });
        bloom.style.transition = "top .7s cubic-bezier(.16,1,.3,1), opacity .5s";
        bloom.style.top = "-90px";
        hud.style.opacity = "0";
        setTimeout(function () { overlay.hidden = true; busy = false; bloom.style.opacity = "0"; bloom.style.top = "100%"; }, 950);
      });
    }
  };
})();
