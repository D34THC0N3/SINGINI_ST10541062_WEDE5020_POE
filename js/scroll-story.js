/* ============================================================
   OBSIDIAN MOTORS — scroll-story.js
   The cinematic heart of the home page: "The Drive".
   You scroll → the M3 GTR drives through the underground
   garage while the copy chapters pin in, swap sides, and swap
   out — until the whole scene dissolves to black before the
   rest of the page. GSAP ScrollTrigger provides the scrub;
   three-engine.js provides the garage, the lights and the car.
   Reduced motion: one still frame, chapters stack normally.
   ============================================================ */
import * as THREE from "three";
import {
  createRenderer,
  loadEnvironment,
  makeLightRig,
  loadCar,
  loadScenery,
  watchCanvas,
  showPosterFallback,
  REDUCE_MOTION,
} from "./three-engine.js";

(function () {
  var canvas = document.getElementById("drive-canvas");
  var story = document.querySelector(".story");
  var pin = document.querySelector(".story-pin");
  if (!canvas || !story || !pin) return;

  var chapters = Array.from(document.querySelectorAll(".story-chapter"));
  var hudChapter = document.querySelector("[data-hud-chapter]");
  var hudTicks = document.querySelector("[data-hud-ticks]");

  /* Without JS animation the CSS still stacks the chapters */
  if (REDUCE_MOTION || typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    return; // static readable page; reduced-motion CSS handles the layout
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---- stage ---- */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070708, 0.035);

  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 140);
  var renderer = createRenderer(canvas, 1.22);

  /* debug handle for the test harness (?dbg=1) */
  if (location.search.indexOf("dbg") > -1) {
    window.__om = { scene: scene, camera: camera, renderer: renderer };
  }

  /* environment light: the night-garage HDRI + the 3-point rig */
  loadEnvironment(renderer, scene);
  var rig = makeLightRig(scene);

  /* ---- the garage ----
     The GLB was scaled to a ~60 m lot during conversion. We turn
     it so its longest side runs along X — the direction the car
     will drive. */
  var garage = new THREE.Group();
  scene.add(garage);
  loadScenery("assets/models/garage.glb")
    .then(function (g) {
      var box = new THREE.Box3().setFromObject(g);
      var size = box.getSize(new THREE.Vector3());
      if (size.z > size.x) g.rotation.y = Math.PI / 2; // orient length along X
      garage.add(g);
      /* floor is at y=0 after the pipeline; pull the ceiling shadow
         plane up out of the space so headlights have somewhere to go */
      rig.key.position.set(3, 10, 6);
    })
    .catch(function () {
      /* no scenery — the page still works against pure night */
    });

  /* ---- the hero car ---- */
  var car = null;
  var wheels = [];
  loadCar("assets/models/m3-gtr.glb", { length: 4.6, obsidianPaint: true })
    .then(function (c) {
      car = c;
      scene.add(c);
      /* find wheels by name so they can roll while the car drives */
      c.traverse(function (node) {
        if (node.isMesh && /wheel|tyre|tire|rim/i.test(node.name)) wheels.push(node);
      });
    })
    .catch(function () {
      showPosterFallback(canvas, "assets/images/alpine-garage.jpg",
        "The vault — experience unavailable in this browser");
    });

  /* ---- camera: a fixed stage-side position; it leans with the
     car, so the car crosses the frame through the garage depth ---- */
  var camBase = { x: 0, y: 2.3, z: 13.5 };
  camera.position.set(camBase.x, camBase.y, camBase.z);
  camera.lookAt(0, 0.8, 0);

  watchCanvas(canvas, camera, renderer);

  /* ---- the drive choreography ----
     Control points: scroll progress -> car's X position (metres).
     The car parks for the title, drifts left while chapter 2 sits
     right, swings right for chapter 3, then drives off into the
     fog as the story dissolves into the footer. */
  var path = [
    [0.0, 2.6],   // parked under the title
    [0.18, 2.6],
    [0.42, -5.5], // chapter: car LEFT / text RIGHT
    [0.68, 5.5],  // chapter: car RIGHT / text LEFT
    [0.88, 9.0],
    [1.0, 17.0],  // pulling away into the dark
  ];

  /* piecewise-linear interpolation between control points, with a
     smoothstep inside each span so movement eases, never steps */
  function carXAt(p) {
    for (var i = 0; i < path.length - 1; i++) {
      var a = path[i], b = path[i + 1];
      if (p >= a[0] && p <= b[0]) {
        var t = (p - a[0]) / (b[0] - a[0]);
        t = t * t * (3 - 2 * t); // smoothstep inside the segment
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return path[path.length - 1][1];
  }

  /* each chapter has a window in p; opacity eases in and back out */
  var windowsCh = [
    [0.0, 0.22],
    [0.24, 0.47],
    [0.50, 0.73],
    [0.76, 1.0],
  ];
  function chapterOpacity(i, p) {
    var w = windowsCh[i];
    if (p < w[0] || p > w[1]) return 0;
    var span = w[1] - w[0];
    var inT = Math.min((p - w[0]) / (span * 0.22), 1);
    var outT = Math.min((w[1] - p) / (span * 0.22), 1);
    if (i === 0) inT = 1;          // title shows from the first frame
    return Math.min(inT, outT);
  }

  /* HUD ticks: an rpm bar that fills as the drive progresses */
  var TICKS = 10;
  if (hudTicks) {
    for (var i = 0; i < TICKS; i++) {
      var tickEl = document.createElement("i");
      hudTicks.appendChild(tickEl);
    }
  }

  /* ---- the scrub ---- */
  var progress = 0;
  ScrollTrigger.create({
    trigger: story,
    start: "top top",
    end: "bottom bottom",
    scrub: 0.6, // 0.6s of inertia: the car glides instead of snapping
    onUpdate: function (self) {
      progress = self.progress;
    },
  });

  /* ---- per-frame ---- */
  var prevX = null;
  gsap.ticker.add(function () {
    var x = carXAt(progress);

    if (car) {
      var dx = prevX === null ? 0 : x - prevX;
      car.position.x = x;
      /* wheels roll with distance travelled; the math runs even
         if the model names never matched (wheels[] just stays 0) */
      for (var i = 0; i < wheels.length; i++) {
        wheels[i].rotation.y += dx * 2.6; // radius ~0.35 m → rad ≈ dx/r
      }
      /* lean into the direction of travel, like weight transfer */
      car.rotation.z = THREE.MathUtils.lerp(car.rotation.z, -dx * 0.6, 0.2);
      /* face along the drive axis (length sits along Z after import) */
      car.rotation.y = Math.PI / 2;
    }
    prevX = x;

    /* camera leans with the car but stays put — parallax, not chase */
    camera.position.x = camBase.x + x * 0.16;
    camera.lookAt(x * 0.22, 0.8, 0);

    /* chapters appear in their windows */
    for (var c = 0; c < chapters.length; c++) {
      var inner = chapters[c].querySelector(".story-chapter-inner");
      var o = chapterOpacity(c, progress);
      if (inner) {
        inner.style.opacity = o.toFixed(3);
        inner.style.transform = "translateY(" + ((1 - o) * 26).toFixed(1) + "px)";
      }
    }

    /* HUD */
    var active = 0;
    for (var w = 0; w < windowsCh.length; w++) {
      if (progress >= windowsCh[w][0]) active = w;
    }
    if (hudChapter) hudChapter.textContent = "0" + (active + 1);
    if (hudTicks) {
      var lit = Math.round(progress * TICKS);
      Array.prototype.forEach.call(hudTicks.children, function (t, i) {
        t.classList.toggle("on", i <= lit);
      });
    }

    /* the final dissolve into page black before the footer */
    var fadeEl = document.querySelector(".story-fade");
    if (fadeEl) {
      var f = THREE.MathUtils.clamp((progress - 0.85) / 0.15, 0, 1);
      fadeEl.style.opacity = f.toFixed(3);
    }

    renderer.render(scene, camera);
  });
})();
