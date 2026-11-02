/* forms.js - client-side validation + mailto handoff for the contact form. */
(function () {
  "use strict";
  var form = document.querySelector("form[data-enquiry]");
  if (!form) return;

  var RECIPIENT = "enquiries@obsidianmotors.co.za";
  var note = form.querySelector("[data-ok]");
  var submitBtn = form.querySelector('button[type="submit"]');
  var btnLabel = submitBtn.textContent;

  function fieldOf(el) { return el.closest(".field"); }

  function setError(el, msg) {
    var f = fieldOf(el);
    if (!f) return;
    f.classList.add("has-error");
    var e = f.querySelector(".field-error");
    if (!e) {
      e = document.createElement("span");
      e.className = "field-error";
      e.setAttribute("role", "alert");
      f.appendChild(e);
    }
    e.textContent = msg;
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", e.id = el.id + "-error");
  }

  function clearError(el) {
    var f = fieldOf(el);
    if (!f) return;
    f.classList.remove("has-error");
    var e = f.querySelector(".field-error");
    if (e) e.remove();
    el.removeAttribute("aria-invalid");
    el.removeAttribute("aria-describedby");
  }

  function messageFor(el) {
    var v = el.value.trim();
    if (el.validity.valueMissing) return "This field is required.";
    if (el.type === "email" && el.validity.typeMismatch) return "Enter a valid email address, like name@domain.com.";
    if (el.type === "tel" && el.validity.patternMismatch) return "Use digits, spaces, + or - only.";
    if (el.id === "m-name" && v.length < 2) return "Name must be at least 2 characters.";
    if (el.id === "m-message" && v.length < 20) return "Message must be at least 20 characters.";
    return "";
  }

  function validate(el) {
    var msg = messageFor(el);
    if (msg) { setError(el, msg); return false; }
    clearError(el);
    return true;
  }

  var fields = form.querySelectorAll("input, select, textarea");
  fields.forEach(function (el) {
    el.addEventListener("blur", function () { validate(el); });
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid") === "true") validate(el); });
    el.addEventListener("change", function () { if (el.getAttribute("aria-invalid") === "true") validate(el); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = Array.prototype.slice.call(fields).map(validate).every(Boolean);
    if (!ok) {
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return;
    }

    var get = function (name) {
      var el = form.elements[name];
      return el ? el.value.trim() : "";
    };

    var subject = "Website message: " + (get("message_type") || "General");
    var body = [
      "Name: " + get("name"),
      "Email: " + get("email"),
      "Message type: " + (get("message_type") || "General"),
      "Interested in: " + (get("vehicle") || "—"),
      "",
      get("message")
    ].join("\n");

    var href = "mailto:" + RECIPIENT +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);

    submitBtn.disabled = true;
    submitBtn.textContent = "Opening your email app…";

    // mailto hands off to the user's mail client - the send action stays with them
    window.location.href = href;

    setTimeout(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = btnLabel;
      if (note) { note.hidden = false; }
      form.reset();
      fields.forEach(clearError);
    }, 900);
  });
})();
