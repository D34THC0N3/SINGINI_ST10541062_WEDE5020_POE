/* motion.js - fade ins, moving text, rpm bar. */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ----- letter splitting bits -----
  function splitChars(el) {
    // keep the real text for screen readers, spans are decoration
    if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent);
    // go through everything so <br> and colours dont break
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var t = node.textContent;
        var frag = document.createDocumentFragment();
        for (var i = 0; i < t.length; i++) {
          var s = document.createElement("span");
          s.textContent = t[i] === " " ? " " : t[i]; // keep the spaces or words stick together
          s.style.display = "inline-block";
          s.style.transform = "translateY(110%)";
          // gsap reads this as y so the tween below lines up
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
  // ----- heading coming in on load -----
  var heroDone = false;
  function heroIn() {
    if (heroDone || reduce) return;
    heroDone = true;
    var h1 = document.querySelector("h1");
    if (h1) {
      var chars = splitChars(h1);
      if (window.gsap) {
        gsap.set(chars, { yPercent: 110 });
        gsap.to(chars, { yPercent: 0, duration: 0.9, ease: "power4.out", stagger: 0.02, overwrite: true });
      }
      else for (var i = 0; i < chars.length; i++) chars[i].style.transform = "none";
    }
    var eb = document.querySelector(".eyebrow");
    if (eb && window.gsap) {
      var c2 = splitChars(eb);
      gsap.set(c2, { yPercent: 110 });
      gsap.to(c2, { yPercent: 0, duration: 0.5, ease: "none", stagger: 0.015 });
    }
  }

  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  if (!reduce && window.gsap && window.ScrollTrigger) {
    // ----- stuff fading in on scroll -----
    ScrollTrigger.batch(".reveal, .section", {
      onEnter: function (batch) {
        gsap.fromTo(batch, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "power4.out", stagger: 0.08, overwrite: true });
      },
      start: "top 85%",
      once: true
    });
    // ----- pics moving slower than the page -----
    document.querySelectorAll(".ph, .carousel-card img").forEach(function (img) {
      var wrap = img.closest(".card, .panel, .carousel-card, .channel-img, .wrap");
      if (!wrap) return;
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    });
    // ----- label then heading then words, one after the other -----
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
    // ----- slat-blind reveals on feature pics, same shutter idea as the door -----
    document.querySelectorAll(".pin-ch img, .story-split img").forEach(function (img) {
      var host = img.parentNode;
      if (!host || host.querySelector(".slats")) return;
      host.style.position = "relative";
      host.style.overflow = "hidden";
      var sl = document.createElement("div");
      sl.className = "slats";
      sl.setAttribute("aria-hidden", "true");
      for (var i = 0; i < 6; i++) sl.appendChild(document.createElement("i"));
      host.appendChild(sl);
      // pics start a bit blurry then snap into focus, cheap cinema trick
      img.style.filter = "blur(8px)";
      ScrollTrigger.create({
        trigger: host, start: "top 80%", once: true,
        onEnter: function () {
          gsap.to(sl.childNodes, { scaleY: 0, duration: 0.7, ease: "expo.inOut", stagger: 0.05 });
          gsap.to(img, { filter: "blur(0px)", duration: 0.6, delay: 0.2 });
        }
      });
    });
    // ----- grid sections tilt in a little like theyre being dealt -----
    document.querySelectorAll(".grid-3, .grid-4").forEach(function (grid) {
      gsap.fromTo(grid, { rotateX: 8, autoAlpha: 0.001, transformPerspective: 900 }, {
        rotateX: 0, autoAlpha: 1, duration: 0.9, ease: "power4.out",
        scrollTrigger: { trigger: grid, start: "top 85%", once: true }
      });
    });
    // ----- light leak + hairline draw when a section rolls in -----
    document.querySelectorAll("main section").forEach(function (sec) {
      var h2 = sec.querySelector("h2");
      var rule = null;
      if (h2 && !sec.querySelector(".rule-line")) {
        rule = document.createElement("span");
        rule.className = "rule-line";
        rule.setAttribute("aria-hidden", "true");
        h2.appendChild(rule);
      }
      ScrollTrigger.create({
        trigger: sec, start: "top 75%", once: true,
        onEnter: function () {
          sec.classList.add("lit");
          setTimeout(function () { sec.classList.remove("lit"); }, 1500);
          if (rule) gsap.to(rule, { scaleX: 1, duration: 0.8, ease: "power3.inOut" });
        }
      });
    });
    // ----- split slider drag + arrows -----
    document.querySelectorAll(".split").forEach(function (sp) {
      var val = 50;
      function set(v) {
        val = Math.max(5, Math.min(95, v));
        sp.style.setProperty("--split", val + "%");
        sp.setAttribute("aria-valuenow", Math.round(val));
      }
      var dragging = false;
      sp.addEventListener("pointerdown", function (e) { dragging = true; try { sp.setPointerCapture(e.pointerId); } catch (err) {} });
      sp.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var r = sp.getBoundingClientRect();
        set((e.clientX - r.left) / r.width * 100);
      });
      addEventListener("pointerup", function () { dragging = false; });
      sp.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { set(val - 6); e.preventDefault(); }
        if (e.key === "ArrowRight") { set(val + 6); e.preventDefault(); }
      });
    });
    // ----- tapes drift opposite ways, two rows passing each other -----
    var tapes = document.querySelectorAll("#tapes .tape");
    tapes.forEach(function (t, i) {
      gsap.fromTo(t, { yPercent: i % 2 ? 6 : -6 }, { yPercent: i % 2 ? -6 : 6, ease: "none",
        scrollTrigger: { trigger: "#tapes", start: "top bottom", end: "bottom top", scrub: 1 } });
    });
    // ----- stop the moving text when the tab is hidden -----
    document.querySelectorAll(".marquee-inner, .ticker-track").forEach(function (el) {
      document.addEventListener("visibilitychange", function () {
        el.style.animationPlayState = document.hidden ? "paused" : "running";
      });
    });
    // ----- rpm bar fills up as u scroll -----
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
    // ----- smaller nav after scrolling a bit -----
    var nav = document.querySelector(".nav");
    if (nav) {
      ScrollTrigger.create({
        start: 40,
        onEnter: function () { nav.classList.add("nav-compact"); },
        onLeaveBack: function () { nav.classList.remove("nav-compact"); }
      });
    }
    // ----- big faded numbers that move slower -----
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
    // ----- about page pics that stick then zoom out -----
    // only stick on desktop, on phones it just zooms
    var pinChs = document.querySelectorAll(".pin-ch");
    if (pinChs.length) {
      var canPin = matchMedia("(min-width: 861px)").matches && matchMedia("(pointer:fine)").matches;
      pinChs.forEach(function (ch) {
        var img = ch.querySelector("img");
        if (!img) return;
        // video bed fades in under the still while the chapter is up
        var bed = ch.querySelector(".pin-bg");
        if (bed && window.OM && window.OM.video) {
          if (bed.getAttribute("data-src") && !bed.getAttribute("src")) {
            bed.setAttribute("src", bed.getAttribute("data-src"));
            bed.load();
          }
          ScrollTrigger.create({
            trigger: ch, start: "top 60%", end: "bottom 40%",
            onToggle: function (self) {
              ch.classList.toggle("vid-on", self.isActive);
              if (self.isActive) window.OM.video.play(bed);
              else window.OM.video.stop(bed);
            }
          });
        }
        if (canPin) {
          var tl = gsap.timeline({ scrollTrigger: { trigger: ch, start: "top top", end: "+=40%", scrub: 0.8, pin: true } });
          tl.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none" }, 0);
        } else {
          gsap.fromTo(img, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ch, start: "top bottom", end: "bottom top", scrub: 0.8 } });
        }
      });
    }
    // ----- little chapter label on the right -----
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
    // ----- big footer popup at the bottom -----
    var footer = document.querySelector("footer.footer");
    if (footer) {
      var fClone = footer.cloneNode(true);
      fClone.classList.add("footer-full");
      fClone.setAttribute("aria-hidden", "true");
      // big faded logo behind it
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
        // links come in one by one
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
      // scroll back up to close it
      addEventListener("wheel", function (e) { if (open && e.deltaY < -8) closeFooter(); }, { passive: true });
      addEventListener("keydown", function (e) { if (open && e.key === "Escape") closeFooter(); });
    }
  }

  // ----- quick loading number on other pages -----
  // home has the big intro so skip it there
  if (!reduce) {
    var lbTop = document.createElement("div");
    lbTop.className = "letterbox top";
    lbTop.setAttribute("aria-hidden", "true");
    var lbBot = document.createElement("div");
    lbBot.className = "letterbox bot";
    lbBot.setAttribute("aria-hidden", "true");
    document.body.appendChild(lbTop);
    document.body.appendChild(lbBot);
  }
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

  // ---------- hover bits ----------
  if (!reduce && matchMedia("(pointer:fine)").matches) {
    // underline starts from where ur mouse came in
    document.addEventListener("mouseover", function (e) {
      if (!e.target || !e.target.closest) return;
      var a = e.target.closest("a");
      if (!a || a.closest(".nav-links")) return;
      var r = a.getBoundingClientRect();
      a.style.setProperty("--ul-o", e.clientX < r.left + r.width / 2 ? "left" : "right");
      a.classList.add("ul-in");
    });
    // logo letters wave, motors stays gold
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
      // delay each letter a tiny bit
      logo.querySelectorAll("span.l").forEach(function (s, i) {
        s.style.transitionDelay = (i * 0.02) + "s";
      });
    }
    // cards tilt towards ur mouse
    document.querySelectorAll(".card").forEach(function (card) {
      card.classList.add("tilt-sheen");
      card.addEventListener("pointermove", function (e) {
        if (card.style.position === "fixed") return; // card is blown up
        if (document.documentElement.classList.contains("dragging")) return; // while dragging
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
    // little labels scramble on hover
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

  window.OMMotion = { heroIn: heroIn, splitChars: splitChars };

  // if anything is still hidden after 2.5s something broke, just show it all
  setTimeout(function () {
    document.querySelectorAll("h1 span, .eyebrow span").forEach(function (s) {
      if (getComputedStyle(s).transform !== "none" && !s.closest("#intro")) s.style.transform = "none";
    });
    document.querySelectorAll(".reveal, .section").forEach(function (el) {
      if (+getComputedStyle(el).opacity < 0.05) { el.style.opacity = "1"; el.style.transform = "none"; }
    });
  }, 2500);

  // normal load, just show the heading
  addEventListener("load", function () {
    var gated = false;
    try { if (sessionStorage.getItem("om_transition") === "open") gated = true; } catch (e) {}
    if (document.getElementById("intro")) return; // intro does it
    if (gated) return; // page door does it
    if (document.querySelector(".boot-flash")) return; // loading number does it
    heroIn();
  });
})();
