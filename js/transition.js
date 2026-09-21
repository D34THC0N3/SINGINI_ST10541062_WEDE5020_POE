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
  }

  document.addEventListener("click", function (e) {
    if (!e.target || !e.target.closest) return;
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if (a.target === "_blank" || a.hostname !== location.hostname) return;
    if (href.startsWith("http") && new URL(href, location.href).origin !== location.origin) return;
    if (new URL(a.href).pathname === location.pathname && new URL(a.href).search === location.search) return;
    e.preventDefault();
    closeAndGo(a.href);
  });

  // new page: door opens back up
  addEventListener("pageshow", function () {
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
})();
