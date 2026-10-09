import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ---------- Contact settings ----------
   Messages from the reply card are delivered by FormSubmit (formsubmit.co) to this address.
   The first message sent triggers a one-time confirmation email to this inbox; click it once. */
const CONTACT_EMAIL = 'archivedstudio.mke@gmail.com';
const SITE_URL = 'https://archived-studio.vercel.app';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
if (reduced) root.classList.add('reduced');
document.getElementById('yr').textContent = new Date().getFullYear();

/* ---------- Pieces flown through in the 3D archive (same order as the caption) ---------- */
const PIECES = [
  { src: 'work/thumb-season5-toronto', name: 'Season 5 launch banner' },
  { src: 'work/icon-smith-point-guard', name: 'Smith, point guard icon' },
  { src: 'work/thumb-nathan-smith', name: 'Nathan Smith player feature' },
  { src: 'work/poster-next-journey', name: 'On to the next journey poster' },
  { src: 'work/thumb-get-into-the-spirit', name: 'Get Into the Spirit' },
  { src: 'work/icon-happy-halloween', name: 'Happy Halloween icon' },
  { src: 'work/thumb-trick-or-treat', name: 'Trick or Treat' },
  { src: 'work/thumb-season5-intro', name: 'Season 5 player intro' },
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
// tuck the header away while scrolling down, bring it back on any scroll up
ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (s) => nav.classList.toggle('hide', s.direction === 1 && s.scroll() > window.innerHeight * 0.8),
});
nav.addEventListener('focusin', () => nav.classList.remove('hide'));

/* ---------- Watermark tile (used over every image) ---------- */
async function makeWatermarkTile() {
  try { await document.fonts.load('800 40px "Grenze Gotisch"'); } catch (e) {}
  const c = document.createElement('canvas');
  c.width = 680; c.height = 420;
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.translate(c.width / 2, c.height / 2);
  x.rotate(-0.32);
  x.font = '800 46px "Grenze Gotisch", serif';
  for (let row = -3; row <= 3; row++) {
    for (let col = -2; col <= 2; col++) {
      x.globalAlpha = row % 2 ? 0.55 : 0.9;
      x.fillText('archived studio', col * 360 + (row % 2) * 180, row * 92);
    }
  }
  return c;
}
const wmTilePromise = makeWatermarkTile().then((c) => {
  document.documentElement.style.setProperty('--wm', `url(${c.toDataURL('image/png')})`);
  return c;
});
document.addEventListener('contextmenu', (e) => { if (e.target.closest('.frame')) e.preventDefault(); });

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
document.querySelectorAll('.foot-email').forEach((a) => { a.href = `mailto:${CONTACT_EMAIL}`; a.textContent = CONTACT_EMAIL; });
const fEmail = document.getElementById('f-email');
const fPhone = document.getElementById('f-phone');
function syncReach() {
  const phone = form.reach.value === 'phone';
  document.getElementById('field-phone').hidden = !phone;
  document.getElementById('field-email').hidden = phone;
  fPhone.required = phone;
  fEmail.required = !phone;
  fPhone.setCustomValidity('');
}
form.querySelectorAll('input[name="reach"]').forEach((r) => r.addEventListener('change', syncReach));
syncReach();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const digits = fPhone.value.replace(/\D/g, '');
  fPhone.setCustomValidity(fPhone.required && (digits.length < 10 || digits.length > 15) ? 'Enter a full phone number with area code.' : '');
  const fields = [...form.querySelectorAll('input[required], select[required], textarea[required]')];
  const bad = fields.find((f) => !f.checkValidity());
  fields.forEach((f) => f.setAttribute('aria-invalid', String(!f.checkValidity())));
  if (bad) {
    statusEl.textContent = bad.type === 'email' && bad.value ? 'Check your email address, it looks incomplete.'
      : bad.type === 'tel' && bad.value ? 'Enter a full phone number with area code.'
      : 'Fill in every field so I can reply.';
    statusEl.dataset.state = 'error';
    bad.focus();
    return;
  }
  if (form._honey.value) return; // bots fill hidden fields
  const data = Object.fromEntries(new FormData(form));
  delete data._honey;
  const byPhone = data.reach === 'phone';
  if (byPhone) delete data.email; else delete data.phone;
  data.reach = byPhone ? 'Phone / text' : 'Email';
  sendBtn.disabled = true;
  sendBtn.textContent = 'sending…';
  statusEl.textContent = '';
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...data,
        _subject: `New ${data.topic} request from ${data.name} (reply by ${byPhone ? 'text' : 'email'})`,
        _template: 'table',
        _captcha: 'false',
        // automatic confirmation email to the client (only possible when they gave an email)
        ...(byPhone ? {} : {
          _replyto: data.email,
          _autoresponse: `Hey ${data.name}, thanks for reaching out to Archived Studio! Your ${data.topic.toLowerCase()} request came through and I'll reply within a day with a quote and next steps. You can check the rate card anytime at ${SITE_URL}/#services. Talk soon, Archived Studio`,
        }),
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.success === 'false' || out.success === false) throw new Error(out.message || 'send failed');
    showSent(data);
    form.reset();
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

function showSent(data) {
  const body = form.querySelector('.reply-body');
  const done = document.createElement('div');
  done.className = 'reply-done';
  done.setAttribute('tabindex', '-1');
  const h = document.createElement('p'); h.className = 'done-title'; h.textContent = 'message sent.';
  const p1 = document.createElement('p'); p1.textContent = `Thanks, ${data.name}. Your ${data.topic.toLowerCase()} request is in.`;
  const p2 = document.createElement('p');
  p2.textContent = data.phone
    ? `I'll text you at ${data.phone} with a quote and next steps within a day.`
    : `A confirmation is on its way to ${data.email}, and I'll reply with a quote and next steps within a day.`;
  const again = document.createElement('button'); again.type = 'button'; again.className = 'btn btn-line'; again.textContent = 'send another message';
  again.addEventListener('click', () => { done.remove(); body.hidden = false; statusEl.textContent = ''; syncReach(); form.querySelector('#f-name').focus(); });
  done.append(h, p1, p2, again);
  body.hidden = true;
  body.after(done);
  done.focus();
}

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

    const target = isSmall() ? 5000 : 15000;
    const pts = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push(x, y);
    const total = pts.length / 2;
    // measure the real ink bounds so the word can be fitted tightly
    let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let j = 0; j < pts.length; j += 2) { const px = pts[j], py = pts[j + 1]; if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
    const bw = Math.max(1, x1 - x0), cx = (x0 + x1) / 2, cyy = (y0 + y1) / 2;
    const n = Math.min(target, total);

    const pos = new Float32Array(n * 3), scat = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * total);
      pos[i * 3] = (pts[k * 2] - cx) / bw;          // -0.5..0.5 across the ink width
      pos[i * 3 + 1] = -(pts[k * 2 + 1] - cyy) / bw; // same scale vertically, centred
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
    return { points, mat, aspect: (y1 - y0) / bw };
  }

  // place the particle word inside the .hero-word box, centred, as large as the box allows
  const heroWord = document.querySelector('.hero-word');
  function fitParticles() {
    const { w, h } = visible(0);
    const r = heroWord.getBoundingClientRect();
    const box = { w: (r.width / window.innerWidth) * w, h: (r.height / window.innerHeight) * h };
    const textAspect = particles.aspect;                 // ink height / ink width
    const scale = Math.min(box.w * 1.0, (box.h * 0.95) / textAspect, 30);
    particles.mat.uniforms.uScale.value = scale;
    const cy = (r.top + r.height / 2 + window.scrollY) / window.innerHeight; // 0..1 from top of the page
    particles.mat.uniforms.uLift.value = (0.5 - cy) * h;
    particles.mat.uniforms.uSize.value = (isSmall() ? 24 : 34) * dpr();
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
  // holographic watermark: tiled "archived studio" mask with a gold-to-blue sheen sweeping across each card
  const wmCanvas = await wmTilePromise;
  const wmTex = new THREE.CanvasTexture(wmCanvas);
  wmTex.wrapS = wmTex.wrapT = THREE.RepeatWrapping;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const cardVert = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
  const cardFrag = `
    uniform sampler2D uMap, uWm; uniform float uOpacity, uTime, uAspect, uHas; uniform vec3 uGold, uBlue;
    varying vec2 vUv;
    void main(){
      vec4 base = uHas > 0.5 ? texture2D(uMap, vUv) : vec4(0.09,0.12,0.2,1.0);
      vec2 wuv = vec2(vUv.x * uAspect, vUv.y) * 1.6;
      float wm = texture2D(uWm, wuv).a;
      float band = pow(max(0.0, sin((vUv.x * 1.3 + vUv.y) * 3.2 - uTime * 1.4)), 10.0);
      vec3 holo = mix(uGold, uBlue, smoothstep(0.0, 1.0, vUv.y + 0.25 * sin(uTime * 0.6)));
      vec3 col = base.rgb + wm * (0.07 + band * 0.45) * holo;
      gl_FragColor = vec4(col, base.a * uOpacity);
      #include <colorspace_fragment>
    }`;
  const SIG_FONT = '800 64px "Grenze Gotisch", serif';
  function signedTexture(img) {
    // bake a corner signature into the full-resolution image
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    const s = c.width / 1600;
    x.font = SIG_FONT.replace('64px', `${Math.round(64 * Math.max(s, 0.45))}px`);
    x.textAlign = 'right'; x.textBaseline = 'alphabetic';
    x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 10 * s;
    const g = x.createLinearGradient(c.width * 0.7, 0, c.width, 0);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#FFC53D'); g.addColorStop(1, '#ffffff');
    x.fillStyle = g; x.globalAlpha = 0.9;
    x.fillText('archived', c.width - 26 * Math.max(s, .5), c.height - 22 * Math.max(s, .5));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }
  const cards = PIECES.map((p, i) => {
    const mat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: {
        uMap: { value: null }, uWm: { value: wmTex }, uOpacity: { value: 0 }, uTime, uAspect: { value: 16 / 9 }, uHas: { value: 0 },
        uGold: { value: new THREE.Color('#FFC53D') }, uBlue: { value: new THREE.Color('#7D95FF') },
      },
      vertexShader: cardVert, fragmentShader: cardFrag,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.userData.i = i;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      mat.uniforms.uMap.value = signedTexture(img);
      mat.uniforms.uHas.value = 1;
      mesh.userData.aspect = img.naturalWidth / img.naturalHeight;
      mat.uniforms.uAspect.value = mesh.userData.aspect;
      layoutCards();
    };
    img.src = `${p.src}${isSmall() ? '-sm' : ''}.webp`;
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
    gsap.from(['.hero-top', '.hero-studio', '.scroll-cue'], { y: 20, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.07, delay: 1.2 });

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
  // pause rendering while the solid archive section fully covers the canvas
  const archiveEl = document.querySelector('.archive');
  const covered = () => archiveEl.getBoundingClientRect().top <= 0;

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
    if (document.hidden || covered()) return;
    const t = clock.getElapsedTime();
    uTime.value = reduced ? 0 : t;

    const f = S.flight;
    const enter = Math.min(1, f * 6);            // first ~15% of flight: shape leaves, cards arrive

    // particles
    particles.mat.uniforms.uScatter.value = Math.min(1, S.intro + S.scatter);
    particles.mat.uniforms.uAlpha.value = (1 - S.scatter * 0.55) * (1 - ease(enter) * 0.75);

    // chrome shape
    const sv = ease(S.shape) * (1 - ease(Math.min(1, f * 14)));
    const vis = visible(0);
    const wide = window.innerWidth >= 960;
    // phones: no room beside the stats, so the shape sits out
    const phone = window.innerWidth < 720;
    shape.visible = !phone;
    shape.scale.setScalar(Math.max(0.0001, sv * (wide ? Math.min(vis.h * 0.13, vis.w * 0.075) : vis.h * 0.1)));
    shape.position.x = wide ? vis.w * 0.27 : vis.w * 0.26;
    shape.position.y = wide ? 0 : vis.h * 0.3;
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
      m.material.uniforms.uOpacity.value = enter * (1 - far) * near;
    }

    renderer.render(scene, camera);
  }
  gsap.ticker.add(frame);
  if (reduced) { S.intro = 0; S.shape = 1; }
}
