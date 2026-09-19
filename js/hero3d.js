/* ============================================================
   OBSIDIAN MOTORS — hero3d.js
   Loads the BMW M3 GTR GLB into the hero canvas.
   Scroll-scrubs the car rotation. No external HDRI needed —
   a few directional lights plus PBR materials do the work.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  var canvas = document.getElementById("hero-canvas");
  if (!hero || !canvas) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scene ---- */
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);

  /* ---- camera ---- */
  var camera = new THREE.PerspectiveCamera(
    32,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    100
  );
  camera.position.set(4.2, 1.8, 5.8);
  camera.lookAt(0, 0.25, 0);

  /* ---- renderer ---- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

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
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.85,
      metalness: 0.15,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  /* ---- car container (rotates on scroll) ---- */
  var carGroup = new THREE.Group();
  scene.add(carGroup);

  /* ---- dark metallic paint (no textures in GLB) ---- */
  var paint = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.22,
    metalness: 0.92,
  });

  /* ---- load M3 GTR ---- */
  var loaded = false;
  new GLTFLoader().load("assets/models/m3-gtr.glb", function (gltf) {
    var m = gltf.scene;
    m.traverse(function (c) {
      if (c.isMesh) {
        c.material = paint;
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
    // center on ground
    var box = new THREE.Box3().setFromObject(m);
    var size = box.getSize(new THREE.Vector3());
    var center = box.getCenter(new THREE.Vector3());
    m.position.sub(center);
    m.position.y -= box.min.y;
    m.scale.setScalar(3.2 / size.x);
    carGroup.add(m);
    loaded = true;
  });

  /* ---- scroll ---- */
  var p = 0;
  function onScroll() {
    var span = hero.offsetHeight - window.innerHeight;
    p = span > 0 ? (window.scrollY - hero.offsetTop) / span : 0;
    p = Math.max(0, Math.min(1, p));
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- resize ---- */
  function onResize() {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", onResize);
  onResize();

  /* ---- render loop ---- */
  var targetRot = 0;
  function loop() {
    requestAnimationFrame(loop);
    targetRot = p * Math.PI * 2;
    carGroup.rotation.y += (targetRot - carGroup.rotation.y) * 0.07;
    carGroup.position.y = Math.sin(Date.now() * 0.0008) * 0.015;
    renderer.render(scene, camera);
  }

  if (reduce) {
    carGroup.rotation.y = 0;
    renderer.render(scene, camera);
  } else {
    loop();
  }
})();
