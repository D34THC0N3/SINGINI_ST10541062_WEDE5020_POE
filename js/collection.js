/* collection.js - search/filter the carousel and open photos in a lightbox. */
(function () {
  "use strict";
  var cards = Array.prototype.slice.call(document.querySelectorAll(".carousel-card"));
  if (!cards.length) return;

  // ---------- search + type filter ----------
  var input = document.getElementById("car-search");
  var typeSel = document.getElementById("car-type");
  var countEl = document.querySelector("[data-filter-count]");

  function apply() {
    var q = (input ? input.value : "").trim().toLowerCase();
    var type = typeSel ? typeSel.value : "all";
    var shown = 0;
    cards.forEach(function (card) {
      var name = (card.getAttribute("data-name") || card.textContent).toLowerCase();
      var kind = card.getAttribute("data-type") || "";
      var match = (!q || name.indexOf(q) !== -1) && (type === "all" || kind === type);
      card.classList.toggle("is-filtered-out", !match);
      if (match) shown++;
    });
    if (countEl) countEl.textContent = shown + (shown === 1 ? " car" : " cars");
  }

  if (input) input.addEventListener("input", apply);
  if (typeSel) typeSel.addEventListener("change", apply);
  apply();

  // ---------- lightbox for stills ----------
  var box = document.createElement("div");
  box.id = "lightbox";
  box.hidden = true;
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Photo viewer");
  box.innerHTML =
    '<button class="lb-close" type="button">Close ✕</button>' +
    '<figure style="margin:0;text-align:center"><img alt="" /><figcaption></figcaption></figure>';
  document.body.appendChild(box);

  var img = box.querySelector("img");
  var cap = box.querySelector("figcaption");
  var lastFocus = null;

  function open(src, alt) {
    lastFocus = document.activeElement;
    img.src = src;
    img.alt = alt || "";
    cap.textContent = alt || "";
    box.hidden = false;
    box.querySelector(".lb-close").focus();
  }

  function close() {
    box.hidden = true;
    img.removeAttribute("src");
    if (lastFocus) lastFocus.focus();
  }

  cards.forEach(function (card) {
    var pic = card.querySelector("img");
    if (!pic) return;
    if (card.hasAttribute("data-cursor")) card.setAttribute("data-cursor", "ZOOM");
    // only the photo opens the viewer - the caption area still links to the enquiry page
    pic.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      open(pic.currentSrc || pic.src, pic.alt);
    });
  });

  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.classList.contains("lb-close")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) close();
  });
})();
