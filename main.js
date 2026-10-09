import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ---------- Contact settings ----------
   Messages from the reply card are delivered by FormSubmit (formsubmit.co) to this address.
   The first message sent triggers a one-time confirmation email to this inbox; click it once. */
const CONTACT_EMAIL = 'hello@archived.studio'; // TODO: the studio's real email

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (reduced) root.classList.add('reduced');
document.getElementById('yr').textContent = new Date().getFullYear();

/* ---------- Pieces flown through in the 3D archive (same order as the caption) ---------- */
const PIECES = [
  { src: 'work/thumb-season5-toronto-sm.webp', name: 'Season 5 launch banner' },
  { src: 'work/icon-smith-point-guard-sm.webp', name: 'Smith, point guard icon' },
  { src: 'work/thumb-nathan-smith-sm.webp', name: 'Nathan Smith player feature' },
  { src: 'work/poster-next-journey-sm.webp', name: 'On to the next journey poster' },
  { src: 'work/thumb-get-into-the-spirit-sm.webp', name: 'Get Into the Spirit' },
  { src: 'work/icon-happy-halloween-sm.webp', name: 'Happy Halloween icon' },
  { src: 'work/thumb-trick-or-treat-sm.webp', name: 'Trick or Treat' },
  { src: 'work/thumb-season5-intro-sm.webp', name: 'Season 5 player intro' },
];

/* ---------- Smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? 0 : document.querySelector(id);
      if (el === null) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.4 });
      if (id !== '#top') el.setAttribute('tabindex', '-1'), el.focus({ preventScroll: true });
    });
  });
}

/* ---------- Nav state ---------- */
const nav = document.querySelector('.nav');
ScrollTrigger.create({ start: 40, onUpdate: (s) => nav.classList.toggle('scrolled', s.scroll() > 40) });
document.querySelectorAll('.archive, .about, .contact').forEach((sec) => {
  ScrollTrigger.create({ trigger: sec, start: 'top 64px', end: 'bottom 64px', toggleClass: { targets: nav, className: 'on-light' } });
});

/* ---------- Lightbox ---------- */
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const lbTitle = document.getElementById('lb-title');
document.querySelectorAll('.piece').forEach((btn) => {
  btn.addEventListener('click', () => {
    lbImg.src = btn.dataset.full;
    lbImg.alt = btn.querySelector('img').alt;
    lbTitle.textContent = btn.dataset.title;
    lb.showModal();
    lenis?.stop();
  });
});
lb.addEventListener('close', () => lenis?.start());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

/* ---------- Reply card ---------- */
const form = document.getElementById('reply');
const statusEl = document.getElementById('f-status');
const sendBtn = document.getElementById('f-send');
const direct = document.getElementById('direct-email');
direct.href = `mailto:${CONTACT_EMAIL}`;
direct.textContent = CONTACT_EMAIL;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fields = [...form.querySelectorAll('input[required], select[required], textarea[required]')];
  const bad = fields.find((f) => !f.checkValidity());
  fields.forEach((f) => f.setAttribute('aria-invalid', String(!f.checkValidity())));
  if (bad) {
    statusEl.textContent = bad.type === 'email' && bad.value ? 'Check your email address, it looks incomplete.' : 'Fill in every field so I can reply.';
    statusEl.dataset.state = 'error';
    bad.focus();
    return;
  }
  if (form._honey.value) return; // bots fill hidden fields
  const data = Object.fromEntries(new FormData(form));
  delete data._honey;
  sendBtn.disabled = true;
  sendBtn.textContent = 'sending…';
  statusEl.textContent = '';
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...data, _subject: `New ${data.topic} request from ${data.name}`, _template: 'table', _replyto: data.email, _captcha: 'false' }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.success === 'false' || out.success === false) throw new Error(out.message || 'send failed');
    form.reset();
    statusEl.textContent = 'Message sent. I will reply by email within a day.';
    statusEl.dataset.state = 'ok';
  } catch (err) {
    statusEl.innerHTML = '';
    statusEl.append('That did not go through. Email me directly at ');
    const a = document.createElement('a'); a.href = `mailto:${CONTACT_EMAIL}`; a.textContent = CONTACT_EMAIL;
    statusEl.append(a, '.');
    statusEl.dataset.state = 'error';
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'send message';
  }
});

/* ---------- Stat count-up ---------- */
if (!reduced) {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.6, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => (el.textContent = Math.round(o.v)),
    });
  });
}

/* =========================================================
   3D stage
   ========================================================= */
const canvas = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  root.classList.add('no-webgl');
  canvas.remove();
}

if (renderer) init3D();

async function init3D() {
  const isSmall = () => window.innerWidth < 720;
  const dpr = () => Math.min(window.devicePixelRatio, isSmall() ? 1.5 : 2);
  renderer.setPixelRatio(dpr());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x0c1322, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0c1322, 10, 30);
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  const CAM_Z = 9;
  camera.position.set(0, 0, CAM_Z);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const visible = (z = 0) => {
    const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (CAM_Z - z);
    return { h, w: h * camera.aspect };
  };

  // Scroll-driven state
  const S = { intro: reduced ? 0 : 1, scatter: 0, shape: 0, flight: 0 };
  const uTime = { value: 0 };
  const mouse = new THREE.Vector2(9, 9);   // world-space, starts off-screen
  const pointer = new THREE.Vector2(0, 0); // normalized -1..1

  /* ---------- 1. Particle wordmark ---------- */
  try { await document.fonts.load('900 200px "Grenze Gotisch"'); } catch (e) {}
  const particles = buildParticles();
  scene.add(particles.points);

  function buildParticles() {
    const W = 1400, H = 340;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 260;
    ctx.font = `900 ${size}px "Grenze Gotisch", serif`;
    const mw = ctx.measureText('archived').width;
    size = size * Math.min(1, (W * 0.96) / mw);
    ctx.font = `900 ${size}px "Grenze Gotisch", serif`;
    ctx.fillText('archived', W / 2, H / 2);
    const data = ctx.getImageData(0, 0, W, H).data;

    const target = isSmall() ? 3800 : 8000;
    const pts = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    const total = pts.length / 2;
    const n = Math.min(target, total);

    const pos = new Float32Array(n * 3), scat = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * total);
      pos[i * 3] = (pts[k * 2] / W - 0.5);
      pos[i * 3 + 1] = -(pts[k * 2 + 1] / H - 0.5) * (H / W);
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      const r = 5 + Math.random() * 9, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      scat[i * 3] = r * Math.sin(ph) * Math.cos(th);
      scat[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      scat[i * 3 + 2] = r * Math.cos(ph) - 4;
      rnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aScatter', new THREE.BufferAttribute(scat, 3));
    g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime, uScale: { value: 12 }, uLift: { value: 1.1 },
        uScatter: { value: 1 }, uAlpha: { value: 1 }, uMouse: { value: mouse },
        uSize: { value: 26 * dpr() }, uYellow: { value: new THREE.Color('#FFC53D') }, uPaper: { value: new THREE.Color('#E8EBF1') }, uBlue: { value: new THREE.Color('#3D5CFF') },
      },
      vertexShader: /* glsl */`
        uniform float uTime, uScale, uLift, uScatter, uSize;
        uniform vec2 uMouse;
        attribute vec3 aScatter; attribute float aRand;
        varying float vRand; varying float vScatter;
        void main(){
          vec3 p = position * uScale; p.y += uLift;
          // cursor pushes formed letters apart
          vec2 d = p.xy - uMouse; float dist = length(d);
          p.xy += normalize(d + 1e-4) * smoothstep(1.6, 0.0, dist) * 0.55 * (1.0 - uScatter);
          // drift
          p += vec3(sin(uTime*0.7 + aRand*40.0), cos(uTime*0.6 + aRand*30.0), 0.0) * 0.025;
          float t = smoothstep(0.0, 1.0, clamp(uScatter * 1.25 - aRand * 0.25, 0.0, 1.0));
          vec3 s = aScatter + vec3(sin(uTime*0.15 + aRand*6.28), cos(uTime*0.12 + aRand*6.28), 0.0) * 0.6;
          vec3 fin = mix(p, s, t);
          vec4 mv = modelViewMatrix * vec4(fin, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (0.35 + aRand * 0.4) / -mv.z;
          vRand = aRand; vScatter = t;
        }`,
      fragmentShader: /* glsl */`
        uniform float uAlpha; uniform vec3 uYellow, uPaper, uBlue;
        varying float vRand; varying float vScatter;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.15, d);
          vec3 col = mix(uPaper, uYellow, step(0.86, vRand));
          col = mix(col, uBlue, vScatter * step(0.55, vRand) * 0.8);
          gl_FragColor = vec4(col, a * uAlpha * (0.55 + vRand * 0.45));
        }`,
    });
    const points = new THREE.Points(g, mat);
    points.frustumCulled = false;
    return { points, mat };
  }

  function fitParticles() {
    const { w, h } = visible(0);
    particles.mat.uniforms.uScale.value = Math.min(13, w * 0.9);
    particles.mat.uniforms.uLift.value = isSmall() ? h * 0.16 : h * 0.12;
    particles.mat.uniforms.uSize.value = 26 * dpr();
  }
  fitParticles();

  /* ---------- 2. Chrome centerpiece ---------- */
  const shapeMat = new THREE.MeshPhysicalMaterial({ color: 0xcfd6e6, metalness: 1, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
  shapeMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float w = sin(position.x*2.6 + uTime*1.1) * sin(position.y*2.9 + uTime*0.9) * sin(position.z*2.2 + uTime*0.7);
       transformed += normal * w * 0.12;`
    );
  };
  const shape = new THREE.Mesh(new THREE.TorusKnotGeometry(1.15, 0.38, isSmall() ? 160 : 260, isSmall() ? 24 : 40), shapeMat);
  shape.scale.setScalar(0.0001);
  scene.add(shape);
  const keyY = new THREE.PointLight(0xffc53d, 40, 20); keyY.position.set(4, 3, 4); scene.add(keyY);
  const keyB = new THREE.PointLight(0x3d5cff, 60, 20); keyB.position.set(-4, -2, 3); scene.add(keyB);

  /* ---------- 3. Archive flight ---------- */
  const gallery = new THREE.Group();
  gallery.visible = false;
  scene.add(gallery);
  const SPACING = 6;
  const loader = new THREE.TextureLoader();
  const cards = PIECES.map((p, i) => {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.userData.i = i;
    loader.load(p.src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      mat.map = tex; mat.needsUpdate = true;
      mesh.userData.aspect = tex.image.width / tex.image.height;
      layoutCards();
    });
    gallery.add(mesh);
    return mesh;
  });
  const FLIGHT_START = -2; // first card's z
  function layoutCards() {
    const small = isSmall();
    cards.forEach((m, i) => {
      const a = m.userData.aspect || 16 / 9;
      const hgt = small ? (a < 1.1 ? 2.4 : 1.7) : (a < 1.1 ? 3.0 : 2.5);
      m.scale.set(hgt * a, hgt, 1);
      const side = i % 2 === 0 ? -1 : 1;
      m.position.set(side * (small ? 0.55 : 2.1), (i % 3 - 1) * 0.35, FLIGHT_START - i * SPACING);
      m.rotation.y = -side * 0.18;
    });
  }
  layoutCards();
  const FLIGHT_DIST = (PIECES.length - 1) * SPACING + (CAM_Z - FLIGHT_START) - 3.2;

  /* ---------- Scroll timelines ---------- */
  const caption = document.querySelector('.fc-name');
  const count = document.querySelector('.fc-count');
  let lastIdx = -1;

  if (!reduced) {
    gsap.to(S, { intro: 0, duration: 2.4, ease: 'power3.inOut', delay: 0.2 });
    gsap.from('.hero-copy > *', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 1.3 });

    gsap.to(S, { scatter: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to(S, { shape: 1, ease: 'none', scrollTrigger: { trigger: '.proof', start: 'top 90%', end: 'center center', scrub: true } });
    gsap.to(S, {
      flight: 1, ease: 'none',
      scrollTrigger: {
        trigger: '.flight', start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: (st) => {
          const idx = Math.min(PIECES.length - 1, Math.max(0, Math.round(st.progress * (PIECES.length - 1))));
          if (idx !== lastIdx) {
            lastIdx = idx;
            caption.textContent = PIECES[idx].name;
            count.textContent = `${idx + 1} of ${PIECES.length}`;
          }
        },
      },
    });
  } else {
    S.shape = 0;
  }

  // stop rendering once the solid sections cover the canvas
  let active = true;
  ScrollTrigger.create({
    trigger: '.archive', start: 'top top',
    onEnter: () => (active = false), onLeaveBack: () => (active = true),
  });

  /* ---------- Input ---------- */
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    const { w, h } = visible(0);
    mouse.set(pointer.x * w / 2, pointer.y * h / 2);
  }, { passive: true });
  window.addEventListener('pointerleave', () => mouse.set(99, 99));

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(dpr());
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    fitParticles();
    layoutCards();
  });

  /* ---------- Render ---------- */
  const clock = new THREE.Clock();
  const tilt = new THREE.Vector2();
  const ease = (x) => x * x * (3 - 2 * x);

  function frame() {
    if (!active || document.hidden) return;
    const t = clock.getElapsedTime();
    uTime.value = reduced ? 0 : t;

    const f = S.flight;
    const enter = Math.min(1, f * 6);            // first ~15% of flight: shape leaves, cards arrive

    // particles
    particles.mat.uniforms.uScatter.value = Math.min(1, S.intro + S.scatter);
    particles.mat.uniforms.uAlpha.value = (1 - S.scatter * 0.55) * (1 - ease(enter) * 0.75);

    // chrome shape
    const sv = ease(S.shape) * (1 - ease(enter));
    shape.scale.setScalar(Math.max(0.0001, sv * (isSmall() ? 0.8 : 1.15)));
    shape.position.x = isSmall() ? 0 : 2.6;
    shape.position.y = isSmall() ? 1.4 : 0.1;
    tilt.lerp(pointer, 0.05);
    shape.rotation.x = t * 0.18 + tilt.y * 0.4 + S.scatter * 1.2;
    shape.rotation.y = t * 0.24 + tilt.x * 0.6;

    // flight
    gallery.visible = f > 0.001;
    camera.position.z = CAM_Z - f * FLIGHT_DIST;
    camera.position.x += (tilt.x * 0.4 - camera.position.x) * 0.06;
    camera.position.y += (tilt.y * 0.25 - camera.position.y) * 0.06;
    camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camera.position.z - 10);
    for (const m of cards) {
      const dz = camera.position.z - m.position.z;           // distance in front of camera
      const far = THREE.MathUtils.smoothstep(dz, 7, 16);      // 1 when far away, fades in from the fog
      const near = THREE.MathUtils.smoothstep(dz, 0.6, 2.2);  // 0 once it passes the camera
      m.material.opacity = enter * (1 - far) * near;
    }

    renderer.render(scene, camera);
  }
  gsap.ticker.add(frame);
  if (reduced) { S.intro = 0; S.shape = 1; }
}
