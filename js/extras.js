/* extras.js - the small fun stuff. odometer numbers, tab title, nos egg */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // tab title changes when u leave, feels like the site misses u lol
  var realTitle = document.title;
  document.addEventListener("visibilitychange", function () {
    document.title = document.hidden ? "▸ THE VAULT IS WAITING" : realTitle;
  });

  // typing "nos" anywhere fires a lil speed burst. 10s cooldown so u cant spam it
  if (!reduce) {
    var buf = "", cooled = 0;
    addEventListener("keydown", function (e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      buf = (buf + e.key.toLowerCase()).slice(-3);
      if (buf !== "nos") return;
      if (Date.now() < cooled) return;
      cooled = Date.now() + 10000;
      buf = "";
      burst();
    });
    function burst() {
      // streaks sweep across + the page leans for a sec
      var streaks = document.createElement("div");
      streaks.setAttribute("aria-hidden", "true");
      streaks.style.cssText = "position:fixed;inset:0;z-index:8500;pointer-events:none;overflow:hidden";
      for (var i = 0; i < 6; i++) {
        var s = document.createElement("i");
        s.style.cssText = "position:absolute;left:-40vw;width:40vw;height:1px;top:" + (10 + i * 14) + "%;background:linear-gradient(to right, transparent, rgba(184,151,106,.8), transparent)";
        streaks.appendChild(s);
      }
      document.body.appendChild(streaks);
      if (window.gsap) {
        gsap.to(streaks.children, { x: "180vw", duration: 0.7, ease: "power3.in", stagger: 0.05 });
        gsap.fromTo(document.body, { skewX: -3 }, { skewX: 0, duration: 1.1, ease: "power3.out", clearProps: "skewX" });
        var heat = document.querySelector(".heat-label");
        if (heat) {
          var old = heat.textContent;
          heat.textContent = "HEAT 05/05 ▸ NOS";
          setTimeout(function () { heat.textContent = old; }, 2200);
        }
        // grain doubles for a sec
        document.body.style.setProperty("--grain-boost", "1");
      }
      setTimeout(function () { streaks.remove(); }, 1500);
    }
  }

  // lil gold sweep on the chapter label when the section changes.
  // the hud label lives in motion.js so i just watch it change
  var hudLabel = document.querySelector(".chap-hud .chap-label");
  if (hudLabel && !reduce && window.MutationObserver) {
    var mo = new MutationObserver(function () {
      if (!window.gsap) return;
      gsap.fromTo(hudLabel, { opacity: 0.2 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    });
    mo.observe(hudLabel, { childList: true, characterData: true, subtree: true });
  }
})();
