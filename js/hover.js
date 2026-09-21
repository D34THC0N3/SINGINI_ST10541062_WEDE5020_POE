/* hover.js - extra hover toys. plate flip, headlight flashlight, image colour-in */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  if (reduce || touch) return;

  // car names roll like a split-flap plate when u hover the card
  var glyphs = "ABDEFGHKMNPRSTXZ0123456789";
  document.querySelectorAll(".card h3, .carousel-card h3, .card-title").forEach(function (h) {
    var orig = h.textContent;
    var busy = false;
    var host = h.closest("a, .card, .carousel-card") || h;
    host.addEventListener("mouseenter", function () {
      if (busy) return; busy = true;
      var step = 0;
      var iv = setInterval(function () {
        h.textContent = orig.split("").map(function (c, i) {
          if (c === " ") return " ";
          // letters settle left to right, plate style
          return i < step ? c : glyphs[(Math.random() * glyphs.length) | 0];
        }).join("");
        if (++step > orig.length + 2) { clearInterval(iv); h.textContent = orig; busy = false; }
      }, 28);
    });
  });

  // headlight torch on hero pics, picture only shows where ur mouse is
  document.querySelectorAll(".hero, #hero, .hero-media").forEach(function (hero) {
    hero.classList.add("torch");
    var raf = false;
    hero.addEventListener("pointermove", function (e) {
      if (raf) return; raf = true;
      var x = e.clientX, y = e.clientY;
      requestAnimationFrame(function () {
        raf = false;
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", ((x - r.left) / r.width * 100) + "%");
        hero.style.setProperty("--my", ((y - r.top) / r.height * 100) + "%");
      });
    });
    hero.addEventListener("pointerleave", function () {
      hero.style.setProperty("--mx", "50%");
      hero.style.setProperty("--my", "42%");
    });
  });

  // photos warm up from grey to full colour on hover
  document.querySelectorAll(".card img, .channel-img img, .panel img").forEach(function (img) {
    img.classList.add("warmup");
  });
})();
