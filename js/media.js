/* media.js - image + video fallbacks. hd first, swap to the light one if it fails */
(function () {
  var slow = false;
  // check the connection, on data saver or 2g we serve the small files
  var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ""))) slow = true;

  document.querySelectorAll("img").forEach(function (img) {
    // strip the heavy sources on slow connections, browser picks from whats left
    if (slow && img.srcset) {
      var small = img.srcset.split(",").filter(function (part) {
        return !/hd\//.test(part) && parseInt(part) < 1500;
      });
      if (small.length) img.srcset = small.join(",");
    }
    // if the hd file 404s, fall back to the optimised one
    img.addEventListener("error", function h() {
      var alt = img.getAttribute("data-opt");
      if (alt && img.src.indexOf(alt) === -1) {
        img.removeAttribute("srcset");
        img.src = alt;
      } else {
        // nothing else to try, stop listening so we dont loop
        img.removeEventListener("error", h);
      }
    });
  });

  // videos: hd in data-hd, optimised twin in data-opt
  document.querySelectorAll("video").forEach(function (v) {
    var hd = v.getAttribute("data-hd");
    var opt = v.getAttribute("data-opt");
    if (!hd && !opt) return;
    v.src = (slow && opt) ? opt : (hd || opt);
    var swapped = false;
    v.addEventListener("error", function () {
      // hd didnt load or the codecs missing, try the other one
      if (!swapped && opt && v.src.indexOf(opt) === -1) {
        swapped = true;
        v.src = opt;
        v.load();
      }
    }, true);
  });
})();
