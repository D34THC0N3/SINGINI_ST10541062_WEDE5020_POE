/* ============================================================
   OBSIDIAN MOTORS — showcase3d.js
   Three.js 3D showroom — replaces model-viewer entirely.
   OrbitControls for drag/zoom, turntable toggle, camera presets.
   ============================================================ */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function () {
  "use strict";

  var canvas = document.getElementById("showcase-canvas");
  var stage = document.querySelector(".stage");
  if (!canvas || !stage) return;

  /* ---- car data ---- */
  var cars = [
    { name: "BMW M3 GTR", tag: "The hero of Most Wanted.", spec: "2005 · Garching · 4.0L V8 · RWD" },
    { name: "Mercedes-AMG GT3", tag: "Track-bred theatre.", spec: "2019 · Affalterbach · 4.0L twin-turbo V8 · RWD" },
    { name: "Porsche GT2 RS", tag: "The widowmaker.", spec: "2018 · Stuttgart · 3.8L twin-turbo flat-six · RWD" },
  ];

  /* ---- scene ---- */
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);

  /* ---- camera ---- */
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(5, 2.5, 7);

  /* ---- renderer ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  /* ---- controls ---- */
  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.4, 0);
  controls.minDistance = 3;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.update();

  /* ---- lights ---- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  var key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(5, 8, 4);
  scene.add(key);

  var rim = new THREE.DirectionalLight(0xb8976a, 1.0);
  rim.position.set(-4, 4, -6);
  scene.add(rim);

  var fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-3, 1.5, 4);
  scene.add(fill);

  /* ---- ground ---- */
  var ground = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85, metalness: 0.15 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  /* ---- car container ---- */
  var carGroup = new THREE.Group();
  scene.add(carGroup);

  /* ---- dark metallic paint ---- */
  var paint = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.22,
    metalness: 0.92,
  });

  /* ---- load GLB ---- */
  var model = null;
  new GLTFLoader().load("assets/models/m3-gtr.glb", function (gltf) {
    model = gltf.scene;
    model.traverse(function (c) {
      if (c.isMesh) {
        c.material = paint;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    var box = new THREE.Box3().setFromObject(model);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y -= box.min.y;
    model.scale.setScalar(3.5 / size.x);
    carGroup.add(model);
  });

  /* ---- resize ---- */
  function onResize() {
    var w = stage.clientWidth;
    var h = stage.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);
  onResize();

  /* ---- turntable ---- */
  var spinning = true;
  var spinBtn = document.querySelector(".sc-start");
  if (spinBtn) {
    spinBtn.addEventListener("click", function () {
      spinning = !spinning;
      controls.autoRotate = spinning;
      spinBtn.querySelector("strong").textContent = spinning ? "Pause" : "Play";
    });
  }
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;

  /* ---- camera presets ---- */
  var presets = {
    Exterior: { pos: [5, 2.5, 7], target: [0, 0.4, 0] },
    Profile: { pos: [0, 1.2, 8], target: [0, 0.4, 0] },
    Top: { pos: [0, 10, 0.5], target: [0, 0, 0] },
  };
  var viewBtns = document.querySelectorAll(".sc-view");
  viewBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      viewBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var p = presets[btn.textContent];
      if (!p) return;
      camera.position.set(p.pos[0], p.pos[1], p.pos[2]);
      controls.target.set(p.target[0], p.target[1], p.target[2]);
      controls.update();
    });
  });

  /* ---- car switch (text-only — same GLB for all) ---- */
  var switchBtns = document.querySelectorAll(".sc-switch-btn");
  var nameEl = document.querySelector("[data-sc-name]");
  var tagEl = document.querySelector("[data-sc-tag]");
  var specEl = document.querySelector("[data-sc-spec]");
  var indexEl = document.querySelector("[data-sc-index]");

  switchBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var i = parseInt(btn.dataset.car, 10);
      var c = cars[i];
      if (nameEl) nameEl.textContent = c.name;
      if (tagEl) tagEl.textContent = c.tag;
      if (specEl) specEl.textContent = c.spec;
      if (indexEl) indexEl.textContent = String(i + 1).padStart(2, "0");
    });
  });

  /* ---- render loop ---- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) { spinning = false; controls.autoRotate = false; }

  function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  }
  loop();
})();
