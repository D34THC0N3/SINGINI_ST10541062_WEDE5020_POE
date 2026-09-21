/* motion.js - reveals, marquees, rpm ticker, chapter hud. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- split helpers (overflow hidden + yPercent rise) -----
  function splitChars(el) {
    // walk child nodes so <br> and styled spans survive the split
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var t = node.textContent;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < t.length; i++) {
          var s = document.createElement("span");
          s.textContent = t[i] === " " ? " " : t[i]; // nbsp keeps spaces alive in the split
          s.style.display = "inline-block";
          s.style.transform = "translateY(110%)";
          frag.appendChild(s);
          out.push(s);
        }
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== "BR") {
        out = out.concat(splitChars(node));
      }
    });
    return out;
  }
  function splitLines(el) {
    // words wrapped in mask spans; good enough for short headings
    var text = el.textContent;
    el.innerHTML = text.split(" ").map(function (w) { return '<span style="display:inline-block;overflow:hidden"><span style="display:inline-block;transform:translateY(110%)">' + w + " </span></span>"; }).join("");
    return el.querySelectorAll("span span");
  }

  // ----- hero entrance. fired by the gate reveal, the intro, or plain load -----
  var heroDone = false;
  function heroIn() {
    if (heroDone || reduce) return;
    heroDone = true;
    var h1 = document.querySelector("h1");
    if (h1) {
      var chars = splitChars(h1);
      if (window.gsap) gsap.to(chars, { y: "0%", duration: 0.9, ease: "power4.out", stagger: 0.02, overwrite: true });
      else for (var i = 0; i < chars.length; i++) chars[i].style.transform = "none";
    }
    var eb = document.querySelector(".eyebrow");
    if (eb && window.gsap) {
      var c2 = splitChars(eb);
      gsap.to(c2, { y: "0%", duration: 0.5, ease: "none", stagger: 0.015 });
    }
  }

  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!reduce && window.gsap && window.ScrollTrigger) {
    // ----- base scroll reveals -----
    ScrollTrigger.batch(".reveal, .section", {
      onEnter: function (batch) {
        gsap.fromTo(batch, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "power4.out", stagger: 0.08, overwrite: true });
      },
      start: "top 85%",
      once: true
    });
    // ----- image parallax -----
    document.querySelectorAll(".ph, .carousel-card img").forEach(function (img) {
      var wrap = img.closest(".card, .panel, .carousel-card, .channel-img, .wrap");
      if (!wrap) return;
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    });
    // ----- copy beats: eyebrow → headline → body → cta, inside each section -----
    document.querySelectorAll("main section").forEach(function (sec) {
      var beats = sec.querySelectorAll(".eyebrow, h2, h3, p.lead, .btn-row");
      if (!beats.length) return;
      ScrollTrigger.create({
        trigger: sec, start: "top 78%", once: true,
        onEnter: function () {
          gsap.fromTo(beats, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, ease: "power4.out", stagger: 0.12, overwrite: true });
        }
      });
    });
    // ----- marquee pause on tab hidden -----
    document.querySelectorAll(".marquee-inner").forEach(function (el) {
      document.addEventListener("visibilitychange", function () {
        el.style.animationPlayState = document.hidden ? "paused" : "running";
      });
    });
    // ----- rpm footer ticker: revs rise with page scroll -----
    var rpm = document.querySelector(".rpm");
    if (rpm) {
      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: function (self) {
          var v = Math.round(self.progress * 8200);
          rpm.style.setProperty("--rpm", (self.progress * 100) + "%");
          rpm.setAttribute("data-rpm", v);
        }
      });
    }
    // ----- nav shrinks after 40px -----
    var nav = document.querySelector(".nav");
    if (nav) {
      ScrollTrigger.create({
        start: 40,
        onEnter: function () { nav.classList.add("nav-compact"); },
        onLeaveBack: function () { nav.classList.remove("nav-compact"); }
      });
    }
    // ----- giant ghost chapter numbers, drift slower than content -----
    var secs = document.querySelectorAll("main > section");
    var chapNames = ["The Film", "The Fleet", "After Hours", "Night Run", "Street Tapes", "The Hunt", "The Standard", "Speak"];
    secs.forEach(function (sec, i) {
      if (sec.querySelector(".chap-num")) return;
      var n = document.createElement("span");
      n.className = "chap-num";
      n.textContent = "0" + (i + 1);
      n.setAttribute("aria-hidden", "true");
      sec.style.position = "relative";
      sec.appendChild(n);
      gsap.fromTo(n, { yPercent: 20 }, { yPercent: -20, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 1 } });
    });
    // ----- about pin chapters: each frame holds while its image settles 1.15 -> 1 -----
    // pin only where its cheap (desktop, fine pointer). everywhere else its a plain scrub zoom.
    var pinChs = document.querySelectorAll(".pin-ch");
    if (pinChs.length) {
      var canPin = matchMedia("(min-width: 861px)").matches && matchMedia("(pointer:fine)").matches;
      pinChs.forEach(function (ch) {
        var img = ch.querySelector("img");
        if (!img) return;
        if (canPin) {
          var tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: "top top", end: "+=40%", scrub: 0.8, pin: true } });
          tl.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none" }, 0);
        } else {
          gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ch, start: "top bottom", end: "bottom top", scrub: 0.8 } });
        }
      });
    }
    // ----- chapter HUD, right edge -----
    if (secs.length > 1 && innerWidth > 860) {
      var hud = document.createElement("div");
      hud.className = "chap-hud";
      hud.setAttribute("aria-hidden", "true");
      hud.innerHTML = '<span class="chap-fill"></span><span class="chap-label">CH.01 — ' + (secs[0].querySelector(".eyebrow") ? secs[0].querySelector(".eyebrow").textContent.toUpperCase() : chapNames[0].toUpperCase()) + "</span>";
      document.body.appendChild(hud);
      var fill = hud.querySelector(".chap-fill");
      var lab = hud.querySelector(".chap-label");
      ScrollTrigger.create({
        trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3,
        onUpdate: function (self) { fill.style.transform = "scaleY(" + self.progress + ")"; }
      });
      secs.forEach(function (sec, i) {
        ScrollTrigger.create({
          trigger: sec, start: "top 55%", end: "bottom 55%",
          onToggle: function (self) {
            if (self.isActive) {
              var e = sec.querySelector(".eyebrow");
              lab.textContent = "CH.0" + (i + 1) + " — " + (e ? e.textContent.toUpperCase() : (chapNames[i] || "SCENE").toUpperCase());
            }
          }
        });
      });
    }
    // ----- fullscreen footer takeover (scroll into the pit wall) -----
    var footer = document.querySelector("footer.footer");
    if (footer) {
      var fClone = footer.cloneNode(true);
      fClone.classList.add("footer-full");
      fClone.setAttribute("aria-hidden", "true");
      // crystal watermark behind everything
      var wm = document.createElement("img");
      wm.src = "assets/icons/logo-crystal.svg"; wm.alt = ""; wm.className = "footer-watermark";
      fClone.insertBefore(wm, fClone.firstChild);
      document.body.appendChild(fClone);
      var open = false, busy = false;
      var openFooter = function () {
        if (open || busy) return; busy = true;
        fClone.style.visibility = "visible";
        gsap.fromTo(fClone, { clipPath: "inset(46% 4% 46% 4% round 14px)" }, {
          clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 0.6, ease: "power4.inOut",
          onComplete: function () { open = true; busy = false; }
        });
        // big-links stagger + watermark breathe
        gsap.fromTo(fClone.querySelectorAll("a, h4"), { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "power4.out", stagger: 0.05, delay: 0.25 });
        var r = fClone.querySelector(".rpm");
        if (r) gsap.fromTo(r, { "--rpm": "0%" }, { "--rpm": "100%", duration: 1.1, ease: "power2.inOut", delay: 0.3 });
      };
      var closeFooter = function () {
        if (!open || busy) return; busy = true;
        gsap.to(fClone, {
          clipPath: "inset(46% 4% 46% 4% round 14px)", duration: 0.45, ease: "power4.inOut",
          onComplete: function () { fClone.style.visibility = "hidden"; open = false; busy = false; }
        });
      };
      ScrollTrigger.create({
        trigger: footer, start: "top 20%",
        onEnter: openFooter
      });
      // scroll up off the bottom closes it again
      addEventListener("wheel", function (e) { if (open && e.deltaY < -8) closeFooter(); }, { passive: true });
      addEventListener("keydown", function (e) { if (open && e.key === "Escape") closeFooter(); });
    }
  }

  // ----- non-index quick boot flash (300ms counter) -----
  // index has the full intro instead, skip there
  if (!reduce && !document.getElementById("intro") && !sessionStorage.getItem("om_transition")) {
    var fb = document.createElement("div");
    fb.className = "boot-flash";
    fb.setAttribute("aria-hidden", "true");
    fb.innerHTML = '<span class="boot-num">000</span>';
    document.body.appendChild(fb);
    var bfNum = fb.querySelector(".boot-num");
    var v = 0;
    var bt = setInterval(function () {
      v = Math.min(100, v + 34);
      bfNum.textContent = String(v).padStart(3, "0");
      if (v >= 100) {
        clearInterval(bt);
        fb.style.opacity = "0";
        setTimeout(function () { fb.remove(); heroIn(); }, 180);
      }
    }, 50);
  }

  // ---------- hover library ----------
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    // underline draws in from whatever side the cursor entered from
    document.addEventListener("mouseover", function (e) {
      if (!e.target || !e.target.closest) return;
      var a = e.target.closest("a");
      if (!a || a.closest(".nav-links")) return;
      var r = a.getBoundingClientRect();
      a.style.setProperty("--ul-o", e.clientX < r.left + r.width / 2 ? "left" : "right");
      a.classList.add("ul-in");
    });
    // nav wordmark letter wave — split obsidian | motors, keep gold on motors
    var logo = document.querySelector(".nav-logo");
    if (logo && !logo.dataset.split) {
      logo.dataset.split = "1";
      Array.prototype.slice.call(logo.childNodes).forEach(function (node) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          var frag = document.createDocumentFragment();
          node.textContent.trim().split("").forEach(function (ch) {
            var s = document.createElement("span");
            s.className = "l"; s.textContent = ch;
            frag.appendChild(s);
          });
          logo.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName === "SPAN") {
          var t = node.textContent;
          node.textContent = "";
          t.split("").forEach(function (ch) {
            var s = document.createElement("span");
            s.className = "l"; s.style.color = "var(--gold)"; s.textContent = ch;
            node.appendChild(s);
          });
        }
      });
      // stagger the wave per letter
      logo.querySelectorAll("span.l").forEach(function (s, i) {
        s.style.transitionDelay = (i * 0.02) + "s";
      });
    }
    // cursor-tracked 3d tilt on grid cards (carousel does its own skew drama)
    document.querySelectorAll(".card").forEach(function (card) {
      card.classList.add("tilt-sheen");
      card.addEventListener("pointermove", function (e) {
        if (card.style.position === "fixed") return; // peek open
        if (document.documentElement.classList.contains("dragging")) return; // mid carousel drag
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = "transform .1s linear";
        card.style.transform = "perspective(900px) rotateY(" + (px * 6) + "deg) rotateX(" + (-py * 6) + "deg)";
        card.style.setProperty("--sx", (px * 60));
      });
      card.addEventListener("pointerleave", function () {
        if (card.style.position === "fixed") return;
        card.style.transition = "transform .45s cubic-bezier(.22,1,.36,1)";
        card.style.transform = "";
        card.style.setProperty("--sx", 0);
      });
    });
    // decrypt scramble on mono chips (spec lines, BL badges, tags)
    var glyphs = "▮▞▚◢◤#@%&$0123456789";
    document.querySelectorAll(".heat-label, .card-price, .card-cue, [style*='IBM Plex Mono'], .mono-chip").forEach(function (chip) {
      var busy = false;
      chip.addEventListener("mouseenter", function () {
        if (busy) return; busy = true;
        var orig = chip.textContent;
        var step = 0;
        var iv = setInterval(function () {
          chip.textContent = orig.split("").map(function (c, i) {
            return (c === " " || i / orig.length < step / 5) ? c : glyphs[(Math.random() * glyphs.length) | 0];
          }).join("");
          if (++step >= 5) { clearInterval(iv); chip.textContent = orig; busy = false; }
        }, 50);
      });
    });
  }

  window.OMMotion = { heroIn: heroIn, splitLines: splitLines, splitChars: splitChars };

  // plain load (no intro, no gate): fire hero on load
  addEventListener("load", function () {
    var gated = false;
    try { if (sessionStorage.getItem("om_transition") === "open") gated = true; } catch (e) {}
    if (document.getElementById("intro")) return; // intro will fire it
    if (gated) return; // gate will fire it
    if (document.querySelector(".boot-flash")) return; // boot flash will fire it
    heroIn();
  });
})();
