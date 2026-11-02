/* include.js - client-side partial loader for nav, footer */
(function () {
  "use strict";

  var page = (document.body.dataset.page || "").toLowerCase();
  var schema = document.body.dataset.schema || "";

  // Load nav partial
  fetch("/includes/nav.html")
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var placeholder = document.getElementById("nav-placeholder");
      if (!placeholder) return;
      placeholder.outerHTML = html;
      // Mark current page link
      var current = document.querySelector('.nav-links a[data-nav-link="' + page + '"]');
      if (current) current.classList.add("is-current");
    })
    .catch(function (err) { console.warn("Nav load failed:", err); });

  // Load footer partial
  fetch("/includes/footer.html")
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var placeholder = document.getElementById("footer-placeholder");
      if (!placeholder) return;
      placeholder.outerHTML = html;
      // Update year
      var yearEl = document.querySelector("[data-year]");
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    })
    .catch(function (err) { console.warn("Footer load failed:", err); });

  // Inject JSON-LD schema
  if (schema) {
    var script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = schema;
    document.head.appendChild(script);
  }
})();