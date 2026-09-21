/* story.js - the drive. road line down the page, bokeh lights, wobbly headings */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var main = document.querySelector("main");
  if (!main) return;

  // ----- blurry street light dots that drift behind everything -----
  var bokeh = document.createElement("div");
  bokeh.className = "bokeh";
  bokeh.setAttribute("aria-hidden", "true");
  var cols = ["rgba(237,232,224,.08)", "rgba(184,151,106,.1)", "rgba(237,232,224,.05)", "rgba(184,151,106,.06)"];
  for (var i = 0; i < 11; i++) {
    var b = document.createElement("i");
    var size = 30 + Math.random() * 90;
    b.style.cssText = "position:absolute;width:" + size + "px;height:" + size + "px;border-radius:50%;" +
      "left:" + (Math.random() * 96) + "%;top:" + (Math.random() * 100) + "%;" +
      "background:radial-gradient(circle," + cols[i % 4] + ",transparent 70%);filter:blur(6px)";
    bokeh.appendChild(b);
  }
  document.body.appendChild(bokeh);
  // they float the other way from the scroll, gives depth
  gsap.to(bokeh, { yPercent: -12, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1.2 } });

  // ----- the road. one wiggly gold line that draws itself as u scroll -----
  var tall = main.offsetHeight;
  if (tall > innerHeight * 1.5) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "road");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(ns, "path");
    // lazy sine wave down the left margin
    var d = "M 40 0";
    var steps = Math.floor(tall / 220);
    for (var s = 1; s <= steps; s++) {
      var y = s * 220;
      var x = 40 + Math.sin(s * 1.1) * 22;
      d += " C " + (40 + Math.sin((s - 0.5) * 1.1) * 22) + " " + (y - 110) + ", " + x + " " + (y - 110) + ", " + x + " " + y;
    }
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    svg.appendChild(path);
    svg.style.height = tall + "px";
    document.body.appendChild(svg);
    var len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    var dot = document.createElement("div");
    dot.className = "road-dot";
    dot.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    ScrollTrigger.create({
      trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.6,
      onUpdate: function (self) {
        path.style.strokeDashoffset = len * (1 - self.progress);
        var pt = path.getPointAtLength(len * self.progress);
        dot.style.transform = "translate(" + (pt.x - 3) + "px," + (pt.y - 3) + "px)";
      }
    });
  }

  // ----- headings lean a bit when u scroll fast, like speedshake -----
  var heads = document.querySelectorAll("h1, h2.display-nfs, h2");
  var skewTo = [];
  heads.forEach(function (h) {
    skewTo.push(gsap.quickTo(h, "skewY", { duration: 0.5, ease: "power3.out" }));
  });
  if (heads.length) {
    ScrollTrigger.create({
      onUpdate: function (self) {
        var v = gsap.utils.clamp(-1.5, 1.5, self.getVelocity() / 2400);
        skewTo.forEach(function (fn) { fn(v); });
      }
    });
  }

  // ----- section headers wipe up with a little mask so cuts feel intentional -----
  document.querySelectorAll("main > section > .wrap > header, main > section > header").forEach(function (hd) {
    gsap.fromTo(hd, { clipPath: "inset(0 0 100% 0)", autoAlpha: 0.001 }, {
      clipPath: "inset(0 0 -10% 0)", autoAlpha: 1, duration: 0.8, ease: "expo.inOut",
      scrollTrigger: { trigger: hd, start: "top 84%", once: true }
    });
  });

  // ----- next-chapter kickers so no section ends dead -----
  var secs = document.querySelectorAll("main > section");
  secs.forEach(function (sec, i) {
    if (i >= secs.length - 1 || sec.querySelector(".next-kick")) return;
    var nextEb = secs[i + 1].querySelector(".eyebrow, .pin-tag, h1, h2");
    var name = nextEb ? nextEb.textContent.trim().toUpperCase().slice(0, 26) : "NEXT";
    var kick = document.createElement("p");
    kick.className = "next-kick";
    kick.setAttribute("aria-hidden", "true");
    kick.innerHTML = "NEXT&nbsp;&nbsp;<b>" + name + "</b>&nbsp;&nbsp;<span class='nk-arrow'>→</span>";
    sec.appendChild(kick);
  });

  // ----- chase cam band between the two biggest acts -----
  if (secs.length > 3 && !document.querySelector(".chase") && matchMedia("(min-width: 861px)").matches) {
    var mid = secs[Math.floor(secs.length / 2)];
    var chase = document.createElement("div");
    chase.className = "chase";
    chase.setAttribute("aria-hidden", "true");
    chase.innerHTML = "<img src='assets/images/desert-wreck.webp' alt='' loading='lazy'>" +
      "<span class='chase-word'>NIGHT RUN</span>" +
      "<i class='streak' style='top:30%'></i><i class='streak' style='top:52%'></i><i class='streak' style='top:74%'></i>";
    mid.parentNode.insertBefore(chase, mid);
    var cimg = chase.querySelector("img");
    gsap.fromTo(cimg, { yPercent: -12 }, { yPercent: 12, ease: "none",
      scrollTrigger: { trigger: chase, start: "top bottom", end: "bottom top", scrub: 0.8 } });
    chase.querySelectorAll(".streak").forEach(function (s, i) {
      gsap.fromTo(s, { x: "0vw" }, { x: "160vw", ease: "none",
        scrollTrigger: { trigger: chase, start: "top bottom", end: "bottom top", scrub: 1 + i * 0.2 } });
    });
  }

  // ----- nav crystal turns a little as u scroll, quiet mechanical thing -----
  var gem = document.querySelector(".nav-logo .crystal");
  if (gem) {
    gsap.fromTo(gem, { rotate: 0 }, { rotate: 90, ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 1 } });
  }
})();
