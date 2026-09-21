// carousel. endless drift marquee + fullscreen peek on hold
(function () {
  try {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  var wrap = document.querySelector(".carousel");
  if (!wrap) return;
  if (reduce) return; // plain grid if js is off
  var cards = Array.prototype.slice.call(wrap.querySelectorAll(".carousel-card"));
  if (!cards.length || !window.gsap) return;
  var heat = document.querySelector(".heat-fill");
  var label = document.querySelector(".heat-label");

  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-roledescription", "carousel");
  wrap.setAttribute("aria-label", "Collection cars");
  var live = document.createElement("p");
  live.className = "peek-live";
  live.setAttribute("aria-live", "polite");
  live.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
  wrap.appendChild(live);

  // double the track so it loops forever
  var track = document.createElement("div");
  track.className = "drift";
  track.style.cssText = "display:flex;gap:4vw;width:max-content;will-change:transform";
  cards.forEach(function (c) { track.appendChild(c); });
  cards.forEach(function (c) {
    var cl = c.cloneNode(true);
    cl.setAttribute("aria-hidden", "true");
    cl.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
    cl.tabIndex = -1;
    track.appendChild(cl);
  });
  wrap.appendChild(track);
  wrap.style.overflow = "hidden";

  var drift = gsap.to(track, { xPercent: -50, duration: 45, ease: "none", repeat: -1,
    onUpdate: function () {
      var p = drift.progress();
      if (heat) heat.style.width = (p * 100) + "%";
      if (label) label.textContent = "HEAT " + String(Math.min(4, Math.floor(p * 4) + 1)).padStart(2, "0") + "/04";
    }
  });
  function slow() { gsap.to(drift, { timeScale: 0, duration: 0.4 }); }
  function go() { gsap.to(drift, { timeScale: 1, duration: 0.6 }); }

  // drag or wheel adds speed, eases back after
  var backTimer = null;
  if (window.Observer) {
    gsap.registerPlugin(Observer);
    Observer.create({ target: wrap, type: "pointer,touch,wheel",
      onChange: function (self) {
        var v = Math.abs((self.deltaX || 0) + (self.deltaY || 0)) / 40;
        drift.timeScale(gsap.utils.clamp(-4, 5, 1 + v));
        var sk = gsap.utils.clamp(-3, 3, v * 2);
        gsap.to(track, { skewX: sk, duration: 0.2, overwrite: true });
        clearTimeout(backTimer);
      },
      onStop: function () {
        backTimer = setTimeout(function () {
          go();
          gsap.to(track, { skewX: 0, duration: 0.5 });
        }, 600);
      }
    });
  }
  wrap.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") drift.timeScale(3);
    if (e.key === "ArrowLeft") drift.timeScale(-2);
  });
  wrap.addEventListener("keyup", go);

  // roving focus on the real cards only
  cards.forEach(function (c, i) {
    c.tabIndex = i === 0 ? 0 : -1;
    c.addEventListener("focus", function () {
      slow();
      cards.forEach(function (b, j) { b.tabIndex = j === i ? 0 : -1; });
      live.textContent = "Card " + (i + 1) + " of " + cards.length;
    });
    c.addEventListener("blur", go);
  });

  // ----- fullscreen peek -----
  var dim = document.createElement("div");
  dim.id = "peek-dim";
  dim.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);opacity:0;transition:opacity .35s;z-index:7990;pointer-events:none";
  document.body.appendChild(dim);
  var peek = document.createElement("div");
  peek.id = "peek";
  peek.hidden = true;
  peek.setAttribute("role", "dialog");
  peek.setAttribute("aria-modal", "true");
  peek.setAttribute("aria-label", "Car dossier");
  document.body.appendChild(peek);

  var ring = document.createElement("div");
  ring.className = "peek-ring";
  ring.setAttribute("aria-hidden", "true");
  ring.innerHTML = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" class="pr-track"/><circle cx="20" cy="20" r="17" class="pr-fill"/></svg>';
  document.body.appendChild(ring);
  var RC = 2 * Math.PI * 17;
  var ringFill = ring.querySelector(".pr-fill");
  ringFill.style.strokeDasharray = RC;
  ringFill.style.strokeDashoffset = RC;

  var specs = {
    "BMW M3 GTR": ["3.2 V8 · 493 hp", "6-speed sequential", "Most Wanted hero, wing included"],
    "Mercedes-AMG GT3": ["6.2 V8 · 550 hp", "race box, road plates", "Evo aero, carbon everything"],
    "McLaren F1 GTR Longtail": ["6.1 V12 · 600 hp", "RWD, gold bay", "97 longtail, Woking royalty"],
    "Pagani Zonda F": ["7.3 V12 · 602 hp", "gated manual", "the F that started it"]
  };
  var openCard = null, lastFocus = null;

  function openPeek(card) {
    if (openCard) return;
    openCard = card;
    lastFocus = document.activeElement;
    ring.classList.remove("on");
    slow();
    var r = card.getBoundingClientRect();
    var img = card.querySelector("img, video");
    var title = card.querySelector("h3") ? card.querySelector("h3").textContent : "Vault car";
    var bl = card.querySelector("span") ? card.querySelector("span").textContent : "";
    var sp = specs[title] || ["verified", "papered", "vault kept"];
    var media = "";
    if (img && img.tagName === "VIDEO") {
      media = "<video class='peek-media' src='" + img.currentSrc + "' muted loop playsinline autoplay></video>";
    } else if (img) {
      media = "<img class='peek-media' src='" + img.src + "' alt='" + (img.alt || title) + "'>";
    }
    peek.innerHTML = "<button class='peek-close' type='button'>CLOSE ✕</button>" + media +
      "<div class='peek-spec'><p class='mono-kicker'>" + bl + "</p>" +
      "<h3 class='display-nfs' style='font-size:2rem;margin:8px 0;'>" + title + "</h3>" +
      "<p>" + sp.join(" · ") + "</p>" +
      "<p style='margin-top:16px;'><a class='btn peek-go' href='" + card.href + "'>Open the dossier →</a></p></div>";
    // dossier click stores where the film was so the next page can pick it up
    var goBtn = peek.querySelector(".peek-go");
    var cardVid = card.querySelector("video");
    if (goBtn && cardVid) {
      goBtn.addEventListener("click", function () {
        try {
          var vsrc = cardVid.getAttribute("data-src") || cardVid.currentSrc || cardVid.getAttribute("src");
          sessionStorage.setItem("om_handoff", JSON.stringify({ src: vsrc, time: cardVid.currentTime || 0 }));
        } catch (e) {}
      });
    }
    peek.hidden = false;
    card.setAttribute("data-cursor", "CLOSE");
    dim.style.opacity = "1";
    dim.style.pointerEvents = "auto";
    document.body.classList.add("viewing");
    document.body.style.overflow = "hidden";
    gsap.fromTo(peek,
      { clipPath: "inset(" + r.top + "px " + (innerWidth - r.right) + "px " + (innerHeight - r.bottom) + "px " + r.left + "px)" },
      { clipPath: "inset(0px 0px 0px 0px)", duration: 0.7, ease: "expo.inOut",
        onComplete: function () { var b = peek.querySelector(".peek-close"); if (b) b.focus(); } });
    peek.querySelector(".peek-close").addEventListener("click", closePeek);
    dim.addEventListener("click", closePeek);
  }
  function closePeek() {
    if (!openCard) return;
    var card = openCard; openCard = null;
    gsap.to(peek, { clipPath: "inset(50% 50% 50% 50%)", duration: 0.5, ease: "expo.inOut", onComplete: function () {
      peek.hidden = true;
      peek.innerHTML = "";
      dim.style.opacity = "0";
      dim.style.pointerEvents = "none";
      document.body.classList.remove("viewing");
      document.body.style.overflow = "";
      go();
      if (lastFocus) lastFocus.focus();
    }});
  }
  addEventListener("keydown", function (e) { if (e.key === "Escape") closePeek(); });
  peek.addEventListener("pointerleave", function (e) {
    if (touch || !openCard) return;
    var r = peek.getBoundingClientRect();
    if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top - 40 || e.clientY > r.bottom + 40) closePeek();
  });

  cards.forEach(function (card) {
    var timer = null, ringTween = null, halfTimer = null;
    card.setAttribute("data-cursor", card.getAttribute("data-cursor") || "VIEW");
    var tick = document.createElement("span");
    tick.className = "peek-tick";
    tick.setAttribute("aria-hidden", "true");
    tick.textContent = "EXPAND";
    card.appendChild(tick);
    // touch or reduced: taps just follow the link
    if (touch) return;
    card.addEventListener("mouseenter", function () {
      slow();
      card.style.transform = "scale(1.02)";
      ring.classList.add("on");
      ringTween = gsap.fromTo(ringFill, { strokeDashoffset: RC }, { strokeDashoffset: 0, duration: 1.5, ease: "none" });
      halfTimer = setTimeout(function () {
        var sp = card.querySelector("p");
        if (sp && !openCard) { sp.dataset.orig = sp.textContent; sp.textContent = "KEEP HOLDING ▸"; }
      }, 750);
      timer = setTimeout(function () { openPeek(card); }, 1500);
      card.style.transition = "transform .3s";
    });
    card.addEventListener("mousemove", function (e) {
      ring.style.transform = "translate(" + (e.clientX - 20) + "px," + (e.clientY - 20) + "px)";
    });
    card.addEventListener("mouseleave", function () {
      clearTimeout(timer);
      clearTimeout(halfTimer);
      if (ringTween) ringTween.kill();
      ring.classList.remove("on");
      card.style.transform = "";
      var sp = card.querySelector("p");
      if (sp && sp.dataset.orig) { sp.textContent = sp.dataset.orig; delete sp.dataset.orig; }
      if (openCard === card) closePeek();
      else go();
    });
    card.addEventListener("click", function (e) {
      if (openCard) return;
      e.preventDefault();
      clearTimeout(timer);
      clearTimeout(halfTimer);
      openPeek(card);
    });
    card.addEventListener("keydown", function (e) {
      if ((e.key === "Enter" || e.key === " ") && !openCard) { e.preventDefault(); openPeek(card); }
    });
  });
  } catch (e) {}
})();
