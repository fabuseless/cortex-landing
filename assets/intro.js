// The launch animation on the home page: a brain drawn as a graph (folded
// hemispheres, cerebellum and brainstem as nodes, links between neighbours,
// signals running along them). It assembles from scattered points; scrolling
// (or swipe, arrow keys, Space) zooms in while the top bar, sidebar and page
// slide into place, then it removes itself. Plays once per browser tab (or
// always, or on /?intro); Skip or Escape ends it. Colours are the current
// style's tokens. With `data-hold` (a holding page: not paired yet) it only
// assembles and stays, filling its box above the page's text.
import * as THREE from "three";

const root = document.documentElement;
const intro = document.getElementById("intro");
const hold = intro?.hasAttribute("data-hold");

function finish() {
  root.classList.remove("intro-on");
  for (const v of ["--p-intro", "--p-top", "--p-side", "--p-main"]) root.style.removeProperty(v);
  intro?.remove();
}

if (intro && (hold ? !matchMedia("(prefers-reduced-motion: reduce)").matches : root.classList.contains("intro-on"))) {
  try { start(); } catch (e) { console.warn("Cortex intro skipped:", e); finish(); } // no WebGL, say
} else finish();

function start() {
  if (!hold) {
    try { sessionStorage.setItem("cortex:intro", "seen"); } catch {}
    if (/[?&]intro\b/.test(location.search)) history.replaceState(history.state, "", location.pathname + location.hash);
  }
  const css = getComputedStyle(root);
  const tok = (n, fallback) => css.getPropertyValue(n).trim() || fallback;
  const ink = new THREE.Color(tok("--ink", "#282828"));
  const accent = new THREE.Color(tok("--accent", "#fa3600"));
  const paper = new THREE.Color(tok("--bg", "#f2f1ec"));
  const dark = paper.getHSL({}, THREE.SRGBColorSpace).l < 0.5;

  // ---- The brain, as points ---------------------------------------------------
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const waves = Array.from({ length: 5 }, () => {
    const w = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    return { w, f: 7 + rand() * 7, ph: rand() * 6.28 };
  });
  // Gyri and sulci: interfering waves over the surface direction; -1..1.
  const fold = (d) => {
    let s = 0;
    for (const { w, f, ph } of waves) s += Math.sin(f * d.dot(w) + ph + 1.6 * Math.sin(f * 0.6 * d.dot(waves[0].w)));
    return Math.max(-1, Math.min(1, s / 2.2));
  };

  const pos = [], shade = [];
  const add = (v, k) => { pos.push(v.x, v.y, v.z); shade.push(k); };
  const fib = (n, i) => {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), t = i * 2.399963;
    return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
  };

  const HEMI = 2300;
  for (const side of [-1, 1]) {
    for (let i = 0; i < HEMI; i++) {
      const d = fib(HEMI, i);
      const f = fold(d);
      // Ellipsoid: long front to back (z), flattened underneath, flat inner wall.
      let x = d.x * 0.62, y = d.y * 0.8, z = d.z * 1.12;
      if (d.x * side < 0) x *= 0.42; // the inner wall, flat against the other half
      if (d.y < 0) y *= 0.68;
      if (z > 0) y *= 1.06; else x *= 0.94;
      // Temporal lobe: bulges out and down at the side, ahead of the middle.
      if (d.y < -0.05 && d.z > -0.35 && d.z < 0.75 && d.x * side > 0) { x += 0.08 * Math.sign(x); y -= 0.06; }
      // Lateral (Sylvian) fissure: a groove along the side.
      const fissure = Math.abs(d.y + 0.08 - 0.22 * d.z) < 0.06 && d.z > -0.2 && d.x * side > 0.2;
      const r = 1 + 0.085 * f - (fissure ? 0.09 : 0);
      add(new THREE.Vector3(x * r + side * 0.29, y * r + 0.12, z * r), (f + 1) / 2);
    }
  }
  // Cerebellum: tucked under the back, finely layered.
  for (const side of [-1, 1]) {
    const n = 300;
    for (let i = 0; i < n; i++) {
      const d = fib(n, i);
      const r = 1 + 0.06 * Math.sin(34 * d.y + 2 * d.z);
      add(new THREE.Vector3(side * 0.26 + d.x * 0.36 * r, -0.52 + d.y * 0.24 * r, -0.78 + d.z * 0.3 * r), (Math.sin(34 * d.y) + 1) / 2);
    }
  }
  // Brainstem.
  for (let i = 0; i < 170; i++) {
    const t = i / 170, a = rand() * Math.PI * 2, r = 0.15 - t * 0.04;
    add(new THREE.Vector3(Math.cos(a) * r, -0.35 - t * 0.95, -0.28 - t * 0.22 + Math.sin(a) * r), 0.5);
  }

  const count = pos.length / 3;
  const target = new Float32Array(pos);
  const P = (i) => new THREE.Vector3(target[i * 3], target[i * 3 + 1], target[i * 3 + 2]);

  // ---- Links: each node to its nearest neighbours, plus long tracts ----------
  const cell = 0.11, grid = new Map();
  const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  for (let i = 0; i < count; i++) {
    const k = key(target[i * 3], target[i * 3 + 1], target[i * 3 + 2]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(i);
  }
  const neighbours = Array.from({ length: count }, () => []);
  const edges = [];
  for (let i = 0; i < count; i++) {
    const p = P(i), [cx, cy, cz] = key(p.x, p.y, p.z).split(",").map(Number), near = [];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      for (const j of grid.get(`${cx + dx},${cy + dy},${cz + dz}`) || []) if (j !== i) near.push([p.distanceToSquared(P(j)), j]);
    }
    near.sort((a, b) => a[0] - b[0]);
    for (const [, j] of near.slice(0, 3)) {
      if (j > i || !neighbours[j].includes(i)) { edges.push(i, j); neighbours[i].push(j); neighbours[j].push(i); }
    }
  }
  // Long-range tracts: curves across the middle, like the corpus callosum.
  const tracts = [];
  for (let t = 0; t < 140; t++) {
    const a = Math.floor(rand() * HEMI * 2), b = Math.floor(rand() * HEMI * 2);
    const pa = P(a), pb = P(b);
    if (Math.sign(pa.x) === Math.sign(pb.x)) continue;
    const mid = pa.clone().add(pb).multiplyScalar(0.5).multiplyScalar(0.25);
    const pts = new THREE.QuadraticBezierCurve3(pa, mid, pb).getPoints(18);
    for (let s = 0; s < pts.length - 1; s++) tracts.push(pts[s].x, pts[s].y, pts[s].z, pts[s + 1].x, pts[s + 1].y, pts[s + 1].z);
  }

  // ---- Scene -------------------------------------------------------------------
  const canvas = intro.querySelector("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  const brain = new THREE.Group();
  brain.rotation.x = 0.12;
  scene.add(brain);

  const dot = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)"); grad.addColorStop(0.45, "rgba(255,255,255,0.9)"); grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  // Nodes start scattered and gather into place.
  const scattered = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(3 + rand() * 4);
    scattered.set([d.x, d.y, d.z], i * 3);
  }
  const live = new Float32Array(scattered);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Ridges in full ink, folds lighter: the surface reads as gyri and sulci.
    const c = ink.clone().lerp(paper, Math.max(0, 0.75 - shade[i] * 0.8));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(live, 3));
  nodeGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const nodeMat = new THREE.PointsMaterial({ size: 0.028, map: dot, vertexColors: true, transparent: true, depthWrite: false, alphaTest: 0.05 });
  brain.add(new THREE.Points(nodeGeo, nodeMat));

  const linkGeo = new THREE.BufferGeometry();
  linkGeo.setAttribute("position", new THREE.BufferAttribute(live, 3));
  linkGeo.setIndex(edges);
  const linkMat = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0, depthWrite: false });
  brain.add(new THREE.LineSegments(linkGeo, linkMat));

  const tractGeo = new THREE.BufferGeometry();
  tractGeo.setAttribute("position", new THREE.Float32BufferAttribute(tracts, 3));
  const tractMat = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false });
  brain.add(new THREE.LineSegments(tractGeo, tractMat));

  // Signals: walk from node to neighbouring node.
  const PULSES = 260;
  const pulses = Array.from({ length: PULSES }, () => { const a = Math.floor(rand() * count); return { a, b: neighbours[a][0] ?? a, t: rand(), v: 1.2 + rand() * 2 }; });
  const pulsePos = new Float32Array(PULSES * 3);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = new THREE.PointsMaterial({ size: 0.06, map: dot, color: accent, transparent: true, opacity: 0, depthWrite: false, blending: dark ? THREE.AdditiveBlending : THREE.NormalBlending });
  brain.add(new THREE.Points(pulseGeo, pulseMat));

  // ---- Progress: scroll drives it, eased toward its target ------------------
  let p = 0, goal = 0, done = false;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const ease = (x) => x * x * (3 - 2 * x);
  const nudge = (d) => { goal = clamp(goal + d); };
  const onWheel = (e) => { e.preventDefault(); nudge(e.deltaY / (e.deltaMode ? 12 : 900)); };
  let touchY = null;
  const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
  const onTouchMove = (e) => { e.preventDefault(); if (touchY !== null) { nudge((touchY - e.touches[0].clientY) / 500); touchY = e.touches[0].clientY; } };
  const onKey = (e) => {
    if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); goal = 1; }
    else if (["ArrowDown", "PageDown", " "].includes(e.key)) { e.preventDefault(); nudge(0.25); }
    else if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); nudge(-0.25); }
  };
  if (!hold) {
    addEventListener("wheel", onWheel, { passive: false });
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("keydown", onKey);
  }
  intro.querySelector("[data-intro-skip]")?.addEventListener("click", () => { goal = 1; });
  intro.querySelector("[data-intro-enter]")?.addEventListener("click", () => { goal = 1; });

  let mx = 0, my = 0;
  const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; };
  addEventListener("pointermove", onMove);

  function resize() {
    const w = intro.clientWidth || innerWidth, h = intro.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Landing page: the canvas fills the screen behind the text, so raise the
    // brain by data-shift (a fraction of the height) and fit it to narrow screens.
    if (hold) {
      camera.setViewOffset(w, h, 0, h * (Number(intro.dataset.shift) || 0), w, h);
      camera.zoom = Math.min(1, camera.aspect / 0.8);
    }
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener("resize", resize);

  const born = performance.now();
  let last = born, raf = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const age = (now - born) / 1000;

    // Assemble over the first 2.6 seconds.
    const a = ease(clamp(age / 2.6));
    if (a < 1 || age < 2.7) {
      for (let i = 0; i < count * 3; i++) live[i] = scattered[i] + (target[i] - scattered[i]) * a;
      nodeGeo.attributes.position.needsUpdate = true;
      linkGeo.attributes.position.needsUpdate = true;
    }
    const settled = ease(clamp((age - 1.8) / 1.4));
    linkMat.opacity = settled * (dark ? 0.22 : 0.16) * (1 - p);
    tractMat.opacity = settled * 0.1 * (1 - p);
    pulseMat.opacity = settled * 0.95 * clamp(1 - p * 1.6);

    for (let k = 0; k < PULSES; k++) {
      const s = pulses[k];
      s.t += s.v * dt;
      if (s.t >= 1) {
        const next = neighbours[s.b];
        s.a = s.b; s.b = next.length ? next[Math.floor(rand() * next.length)] : s.a; s.t = 0;
      }
      for (let c = 0; c < 3; c++) pulsePos[k * 3 + c] = live[s.a * 3 + c] + (live[s.b * 3 + c] - live[s.a * 3 + c]) * s.t;
    }
    pulseGeo.attributes.position.needsUpdate = true;

    p += (goal - p) * Math.min(1, dt * 6);
    if (goal >= 1 && p > 0.995) p = 1;
    brain.rotation.y = -0.95 + age * 0.09 + mx * 0.5; // starts three-quarters from the side
    brain.rotation.x = 0.12 + my * 0.25;
    camera.position.set(0, 0.15 - p * 0.15, 5.4 - ease(p) * 4.1);
    camera.lookAt(0, -0.05, 0);
    renderer.render(scene, camera);

    // Hand the page in: top bar first, then the sidebar, then the content.
    root.style.setProperty("--p-intro", p.toFixed(4));
    root.style.setProperty("--p-top", ease(clamp(p / 0.55)).toFixed(4));
    root.style.setProperty("--p-side", ease(clamp((p - 0.2) / 0.55)).toFixed(4));
    root.style.setProperty("--p-main", ease(clamp((p - 0.38) / 0.62)).toFixed(4));

    if (p >= 1 && !done) return end();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function end() {
    done = true;
    cancelAnimationFrame(raf);
    removeEventListener("wheel", onWheel);
    removeEventListener("touchstart", onTouchStart);
    removeEventListener("touchmove", onTouchMove);
    removeEventListener("keydown", onKey);
    removeEventListener("pointermove", onMove);
    removeEventListener("resize", resize);
    for (const o of [nodeGeo, linkGeo, tractGeo, pulseGeo, nodeMat, linkMat, tractMat, pulseMat, dot]) o.dispose();
    renderer.dispose();
    finish();
  }
}
