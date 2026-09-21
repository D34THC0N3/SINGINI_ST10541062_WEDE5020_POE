// intro. once per visit, crystal counts up then the door lifts into the hero
(function () {
  try {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var intro = document.getElementById("intro");
  function hero() { if (window.OMMotion && window.OMMotion.heroIn) window.OMMotion.heroIn(); }
  var seen = false;
  try { seen = sessionStorage.getItem("om_intro_seen") === "1"; } catch (e) {}
  if (!intro || reduce || seen || !window.gsap) {
    if (intro) intro.remove();
    document.body.classList.remove("intro-lock");
    hero();
    return;
  }
  document.body.classList.add("intro-lock");
  document.body.classList.add("viewing"); // letterbox bars grow
  intro.classList.add("mine"); // my timeline drives it, not the css ones

  var wrap = intro.querySelector(".intro-gem-wrap");
  var gem = intro.querySelector(".intro-gem");
  var count = intro.querySelector(".intro-count");
  var hair = intro.querySelector(".intro-hair");
  var sweep = intro.querySelector(".intro-sweep");
  var flash = intro.querySelector(".intro-flash");
  var letters = intro.querySelectorAll(".intro-word span");
  var boot = intro.querySelector(".intro-boot");

  // 3 stacked copies for the quarter turn trick
  var turn = document.createElement("div");
  turn.className = "intro-turn";
  turn.setAttribute("aria-hidden", "true");
  gem.parentNode.insertBefore(turn, gem);
  turn.appendChild(gem);
  var layers = [gem];
  for (var i = 0; i < 2; i++) {
    var c = gem.cloneNode(false);
    turn.appendChild(c);
    layers.push(c);
  }
  gsap.set(turn, { transformStyle: "preserve-3d" });
  gsap.set(layers[0], { z: -12 });
  gsap.set(layers[2], { z: 12 });
  layers.forEach(function (l) { l.style.position = "absolute"; l.style.inset = "0"; });

  // boot line types on char by char
  var bt = boot.textContent;
  boot.textContent = "";
  var bchars = [];
  bt.split("").forEach(function (ch) {
    var s = document.createElement("span");
    s.textContent = ch === " " ? " " : ch;
    s.style.display = "inline-block";
    s.style.opacity = "0";
    boot.appendChild(s);
    bchars.push(s);
  });

  var num = { v: 0 };
  var tl = gsap.timeline({ onComplete: done });
  tl.fromTo(gem, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: "power4.out" }, 0);
  tl.to(num, { v: 100, duration: 2.6, ease: "none", onUpdate: function () {
    var n = Math.round(num.v);
    count.textContent = String(n).padStart(3, "0");
    hair.style.transform = "scaleX(" + n / 100 + ")";
  } }, 0);
  tl.fromTo(sweep, { xPercent: -130 }, { xPercent: 130, duration: 0.8, ease: "power3.inOut" }, 1.0);
  tl.fromTo(turn, { rotationY: -35 }, { rotationY: 35, duration: 1.2, ease: "power3.inOut" }, 2.6);
  tl.fromTo(flash, { opacity: 0 }, { opacity: 0.12, duration: 0.03 }, 3.2);
  tl.to(flash, { opacity: 0, duration: 0.05 }, 3.25);
  tl.fromTo(wrap, { y: -40, scale: 1.15 }, { y: 0, scale: 1, duration: 0.5, ease: "power4.in" }, 3.4);
  tl.fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: 0.5, ease: "power4.out", stagger: 0.03 }, 3.6);
  tl.to(bchars, { opacity: 0.85, duration: 0.01, ease: "none", stagger: 0.015 }, 4.0);
  tl.to({}, { duration: 0.6 });
  tl.to(intro, { autoAlpha: 0, duration: 0.5, ease: "power3.inOut" });

  function done() {
    try { sessionStorage.setItem("om_intro_seen", "1"); } catch (e) {}
    intro.remove();
    document.body.classList.remove("intro-lock", "viewing");
    // door lifts into the hero like the page transitions do
    if (window.OM && window.OM.gate && window.OM.gate.open) window.OM.gate.open();
    setTimeout(hero, 280);
  }

  // click or keys skip it, still lands clean tho
  function skip() { tl.timeScale(6); }
  intro.addEventListener("click", skip);
  addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === "Escape" || e.key === " ") skip();
  });
  } catch (e) {
    var f = document.getElementById("intro");
    if (f) f.remove();
    document.body.classList.remove("intro-lock");
    if (window.OMMotion && window.OMMotion.heroIn) window.OMMotion.heroIn();
  }
})();
