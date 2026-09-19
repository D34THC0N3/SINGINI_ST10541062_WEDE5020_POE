/* ============================================================
   OBSIDIAN MOTORS — three-engine.js
   The ONE shared 3D engine. Both the hero and the showcase are
   thin files on top of this. Everything tricky lives here, once:
     - renderer setup (tone mapping, colour space, pixel ratio)
     - HDRI environment (this is what makes car paint look real)
     - a cinematic 3-point light rig + soft ground shadow
     - GLB loading with Draco + error/poster fallback
     - resize handling + graceful reduced-motion behaviour

   Terminology in the comments is kept plain on purpose — this is
   coursework, and the reader may be new to WebGL.
   ============================================================ */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

/* True when the visitor asked the OS for minimal animation.
   We honour it everywhere: one static frame, no loops. */
export const REDUCE_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* Where our compressed model data decoders live (CDN, no build step). */
const DRACO_PATH = "https://cdn.jsdelivr.net/npm/three@0.167.0/examples/jsm/libs/draco/gltf/";

/* Where the site's lighting mood comes from — the night-garage HDRI
   converted during the Part 2 asset pipeline. */
export const HDRI_URL = "assets/env/garage.hdr";

/* ------------------------------------------------------------
   createRenderer(canvas)
   One renderer per page, configured the cinematography way:
   ACES tone mapping rolls highlights off like film; sRGB output
   keeps colours correct on screen.
   ------------------------------------------------------------ */
export function createRenderer(canvas, exposure = 1.25) {
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true, // transparent canvas — page background shows through
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

/* ------------------------------------------------------------
   loadEnvironment(renderer, scene, url)
   Turns the HDRI photo into image-based lighting (IBL). This is
   THE fix for the old "invisible car" bug: metallic paint shows
   you the room it's standing in, so with no environment the cars
   rendered as black shapes on a black page.
   ------------------------------------------------------------ */
export function loadEnvironment(renderer, scene, url) {
  url = url || HDRI_URL;
  var pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  return new Promise(function (resolve) {
    new RGBELoader().load(
      url,
      function (hdr) {
        var envMap = pmrem.fromEquirectangular(hdr).texture;
        scene.environment = envMap; // IBL — reflections + ambient fill
        hdr.dispose();
        pmrem.dispose();
        resolve(envMap);
      },
      undefined,
      function () {
        // No environment available — fall back to plain ambient light
        // so the page still shows something instead of death-black.
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        resolve(null);
      }
    );
  });
}

/* ------------------------------------------------------------
   makeLightRig(scene)
   A classic 3-point setup, the way a photographer lights a car:
     key  — the main light, warm like tungsten, casts the shadow
     rim  — from behind to pull the car off the dark background
     fill — soft light into the shadows so black isn't a hole
   Plus a ShadowMaterial floor: the car gets a soft contact
   shadow without us having to draw a visible floor disc.
   ------------------------------------------------------------ */
export function makeLightRig(scene) {
  var key = new THREE.DirectionalLight(0xffe6c4, 2.9);
  key.position.set(6, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);

  var rim = new THREE.DirectionalLight(0x9fb4d8, 1.85); // cold steel blue — picks out glass + edges
  rim.position.set(-6, 5, -6);
  scene.add(rim);

  var fill = new THREE.DirectionalLight(0xffffff, 0.62);
  fill.position.set(-3, 1.5, 5);
  scene.add(fill);

  var ambient = new THREE.AmbientLight(0xffffff, 0.25); // floor of visibility
  scene.add(ambient);

  /* Invisible floor that only receives the soft contact shadow. */
  var shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  return { key: key, rim: rim, fill: fill, ambient: ambient };
}

/* ------------------------------------------------------------
   loadCar(url, options) -> Promise<Group>
   Loads a GLB (Draco-compressed), then normalises it so every
   car file "just works": centred on the origin, wheels on y=0,
   real length in metres on its longest side.

   options.length        — real-world car length in metres (default 4.6)
   options.obsidianPaint — force our signature dark clearcoat paint
                           over whatever materials the file ships with
                           (used for the texture-less M3 GTR)
   options.onProgress    — receives 0..1 during download
   ------------------------------------------------------------ */
export function loadCar(url, options) {
  options = options || {};

  var draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);
  var loader = new GLTFLoader();
  loader.setDRACOLoader(draco);

  return new Promise(function (resolve, reject) {
    loader.load(
      url,
      function (gltf) {
        var group = new THREE.Group(); // wrapper we own; gltf.scene stays untouched
        var model = gltf.scene;

        if (options.obsidianPaint) {
          var paint = new THREE.MeshPhysicalMaterial({
            color: 0x0c0c0e,
            metalness: 0.9,
            roughness: 0.28,
            clearcoat: 1.0,
            clearcoatRoughness: 0.15,
          });
          model.traverse(function (child) {
            if (child.isMesh) child.material = paint;
          });
        }

        model.traverse(function (child) {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        /* Measure, then centre + rescale to a sane real-world size. */
        var box = new THREE.Box3().setFromObject(model);
        var size = box.getSize(new THREE.Vector3());
        var center = box.getCenter(new THREE.Vector3());
        var length = options.length || 4.6;
        var scale = length / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        /* recentre after scaling, wheels on the ground */
        model.position.set(
          -center.x * scale,
          -box.min.y * scale,
          -center.z * scale
        );

        group.add(model);
        group.userData.url = url;
        resolve(group);
      },
      function (ev) {
        if (options.onProgress && ev.total > 0) {
          options.onProgress(ev.loaded / ev.total);
        }
      },
      function (err) {
        reject(err);
      }
    );
  });
}

/* ------------------------------------------------------------
   loadScenery(url) -> Promise<Group>
   For environment GLBs (the garage). Unlike loadCar it does NOT
   rescale or recentre — scenery was authored at the right size
   during the Part 1 asset pipeline and the floor sits at y=0.
   ------------------------------------------------------------ */
export function loadScenery(url) {
  var draco = new DRACOLoader();
  draco.setDecoderPath(DRACO_PATH);
  var loader = new GLTFLoader();
  loader.setDRACOLoader(draco);
  return new Promise(function (resolve, reject) {
    loader.load(
      url,
      function (gltf) {
        gltf.scene.traverse(function (child) {
          if (child.isMesh) {
            child.receiveShadow = true;
            /* keep walls from turning into light sponges */
            if (child.material && "envMapIntensity" in child.material) {
              child.material.envMapIntensity = 0.55;
            }
          }
        });
        resolve(gltf.scene);
      },
      undefined,
      reject
    );
  });
}

/* ------------------------------------------------------------
   watchCanvas(canvas, camera, renderer)
   Keeps the canvas crystal-sharp when the window or layout moves.
   Uses ResizeObserver so CSS-driven size changes count too.
   ------------------------------------------------------------ */
export function watchCanvas(canvas, camera, renderer) {
  function sync() {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  new ResizeObserver(sync).observe(canvas);
  sync();
}

/* ------------------------------------------------------------
   showPosterFallback(container, image, caption)
   If WebGL or a download fails, we swap the canvas for a real
   photograph — never a grey box or a silent black hole.
   ------------------------------------------------------------ */
export function showPosterFallback(canvas, image, caption) {
  if (!canvas) return;
  var poster = document.createElement("div");
  poster.className = "poster-fallback";
  poster.innerHTML =
    '<img src="' + image + '" alt="' + (caption || "Car parked in the Obsidian garage") + '">' +
    '<p class="poster-caption">' + (caption || "Interactive 3D unavailable — here's the car.") + "</p>";
  canvas.replaceWith(poster);
}

/* ------------------------------------------------------------
   startLoop(fn) / renderOnce(renderer, scene, camera)
   The one render-loop helper. Honours prefers-reduced-motion by
   drawing a single still frame instead of animating.
   ------------------------------------------------------------ */
export function startLoop(renderer, scene, camera, tick) {
  if (REDUCE_MOTION) {
    renderer.render(scene, camera);
    return function () {}; // nothing to stop
  }
  var alive = true;
  function frame(time) {
    if (!alive) return;
    if (tick) tick(time);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return function stop() {
    alive = false;
  };
}

/* Free GPU memory when a page tears a scene down. */
export function dispose(renderer) {
  renderer.dispose();
  renderer.domElement.remove();
}
