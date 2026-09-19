/* ============================================================
   OBSIDIAN MOTORS — showcase3d.js
   The showroom. Orbit/zoom around any car in the vault, switch
   between the four GLBs, cinematic per-car re-lighting, and a
   Blacklist-style HUD. All the WebGL plumbing: three-engine.js.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  createRenderer,
  loadEnvironment,
  makeLightRig,
  loadCar,
  loadScenery,
  watchCanvas,
  startLoop,
  showPosterFallback,
  REDUCE_MOTION,
} from "./three-engine.js";

(function () {
  var canvas = document.getElementById("showcase-canvas");
  var stage = document.querySelector(".stage");
  if (!canvas || !stage) return;

  /* ---- the vault inventory ---- */
  var cars = [
    {
      model: "assets/models/m3-gtr.glb",
      name: "BMW M3 GTR",
      rank: "#15",
      tag: "The hero of Most Wanted.",
      spec: "2005 · Garching · 4.0L V8 · RWD",
      paint: true, // texture-less GLB gets the obsidian treatment
      poster: "assets/images/mclaren-knightsbridge.jpg",
      light: { key: 2.8, rim: 1.9, exposure: 1.25 },
    },
    {
      model: "assets/models/amg-gt3.glb",
      name: "Mercedes-AMG GT3",
      rank: "#14",
      tag: "Affalterbach in full race trim.",
      spec: "2020 · Affalterbach · 4.0L twin-turbo V8 · RWD",
      poster: "assets/images/amg-gt3.jpg",
      light: { key: 2.6, rim: 1.6, exposure: 1.2 },
    },
    {
      model: "assets/models/mclaren-f1.glb",
      name: "McLaren F1 GTR Longtail",
      rank: "#13",
      tag: "The long-tail unicorn.",
      spec: "1997 · Woking · 6.1L BMW V12 · RWD",
      poster: "assets/images/gt2rs.jpg",
      light: { key: 2.4, rim: 1.8, exposure: 1.3 },
    },
    {
      model: "assets/models/fenomeno.glb",
      name: "Lamborghini Fenomeno",
      rank: "#12",
      tag: "The next big thing, already rare.",
      spec: "2025 · Sant'Agata · 6.5L V12 hybrid · AWD",
      poster: "assets/images/zonda-f.jpg",
      light: { key: 2.7, rim: 1.5, exposure: 1.22 },
    },
  ];

  /* ---- stage ---- */
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080809, 0.045);

  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(5, 2.1, 6.4);

  var renderer = createRenderer(canvas, 1.25);

  /* debug handle for the test harness (?dbg=1) */
  if (location.search.indexOf("dbg") > -1) {
    window.__om = { scene: scene, camera: camera, renderer: renderer };
  }

  /* ---- controls ---- */
  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.55, 0);
  controls.minDistance = 3.2;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotate = !REDUCE_MOTION;
  controls.autoRotateSpeed = 0.9;

  /* ---- light ---- */
  loadEnvironment(renderer, scene);
  var rig = makeLightRig(scene);

  /* ---- the underground garage as the showroom backdrop ---- */
  loadScenery("assets/models/garage.glb")
    .then(function (g) {
      var box = new THREE.Box3().setFromObject(g);
      var size = box.getSize(new THREE.Vector3());
      if (size.z > size.x) g.rotation.y = Math.PI / 2; // length along X
      scene.add(g);
    })
    .catch(function () { /* night-only scene is still fine */ });

  /* ---- car state ---- */
  var carGroup = new THREE.Group();
  scene.add(carGroup);
  var cache = {}; // url -> Promise<Group> so a car only downloads once
  var current = -1;

  function renderCar(i) {
    current = i;
    var c = cars[i];

    /* re-tune the rig per car — every car in a showroom gets its own light */
    rig.key.intensity = c.light.key;
    rig.rim.intensity = c.light.rim;
    renderer.toneMappingExposure = c.light.exposure;

    if (!cache[c.model]) {
      cache[c.model] = loadCar(c.model, {
        length: 4.6,
        obsidianPaint: !!c.paint,
      });
    }
    cache[c.model]
      .then(function (group) {
        if (current !== i) return; // user clicked again mid-download
        carGroup.clear();
        var clone = group.clone();
        carGroup.add(clone);
        updateHud(c, i);
      })
      .catch(function () {
        if (current === i) showPosterFallback(canvas, c.poster, c.name + " — 3D unavailable");
      });
  }

  /* ---- HUD wiring ---- */
  var nameEl = document.querySelector("[data-sc-name]");
  var tagEl = document.querySelector("[data-sc-tag]");
  var specEl = document.querySelector("[data-sc-spec]");
  var rankEl = document.querySelector("[data-sc-index]");
  var switchBtns = document.querySelectorAll(".sc-switch-btn");

  function updateHud(c) {
    if (nameEl) nameEl.textContent = c.name;
    if (tagEl) tagEl.textContent = c.tag;
    if (specEl) specEl.textContent = c.spec;
    if (rankEl) rankEl.textContent = c.rank;
    switchBtns.forEach(function (b, bi) {
      b.classList.toggle("is-active", bi === current);
    });
  }

  switchBtns.forEach(function (btn, i) {
    btn.addEventListener("click", function () {
      renderCar(i);
      if (history.replaceState) history.replaceState(null, "", "?car=" + i);
    });
  });

  /* ---- turntable toggle ---- */
  var startBtn = document.querySelector(".sc-start");
  if (startBtn) {
    startBtn.addEventListener("click", function () {
      controls.autoRotate = !controls.autoRotate;
      var label = startBtn.querySelector("strong");
      if (label) label.textContent = controls.autoRotate ? "Pause" : "Play";
      startBtn.setAttribute("aria-pressed", String(controls.autoRotate));
    });
  }

  /* ---- camera presets (dolly moves cinematographically via GSAP) ---- */
  var presets = {
    exterior: { pos: [5, 2.1, 6.4], target: [0, 0.55, 0] },
    profile: { pos: [0, 1.2, 7.6], target: [0, 0.5, 0] },
    top: { pos: [0, 9, 0.6], target: [0, 0, 0] },
  };

  function flyTo(pos, target) {
    if (REDUCE_MOTION || typeof gsap === "undefined") {
      camera.position.set(pos[0], pos[1], pos[2]);
      controls.target.set(target[0], target[1], target[2]);
      controls.update();
      return;
    }
    gsap.to(camera.position, { x: pos[0], y: pos[1], z: pos[2], duration: 1.1, ease: "power3.out" });
    gsap.to(controls.target, {
      x: target[0], y: target[1], z: target[2], duration: 1.1, ease: "power3.out",
      onUpdate: function () { controls.update(); },
    });
  }

  document.querySelectorAll(".sc-view").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document
        .querySelectorAll(".sc-view")
        .forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var p = presets[btn.textContent.trim().toLowerCase()];
      if (p) flyTo(p.pos, p.target);
    });
  });

  /* ---- boot at the car in the URL (?car=N), else car 0 ---- */
  var m = location.search.match(/car=([0-3])/);
  renderCar(m ? Math.min(cars.length - 1, parseInt(m[1], 10)) : 0);

  watchCanvas(canvas, camera, renderer);

  startLoop(renderer, scene, camera, function () {
    controls.update();
  });
})();
