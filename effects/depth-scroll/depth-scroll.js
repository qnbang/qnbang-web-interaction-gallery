/**
 * Depth Scroll — 스크롤 속도를 정점 곡률로 바꿔 원근 깊이감을 내는 가로 이미지 갤러리.
 * 원리: 관성 스크롤에서 velocity(속도)를 뽑아 → vertex 곡률 uniform → PerspectiveCamera 투영.
 *   ① 상시 깊이 곡률(uDepth): 스트립이 원통 안쪽처럼 휘어 정지해도 공간감.
 *   ② 속도→곡률(uCurve×uVelocity): 빠를수록 출렁이고 멈추면 평평(velGain·lerp 관성).
 * 원본 meech213.com main.js(Three.js TSL)의 uScrollSpeed/uCurveStrength/uCurveFrequency/
 * uDepthCurveStrength deform을 표준 Three.js + GLSL로 재구현.
 */
import * as THREE from 'three';

const DEFAULTS = {
  images: [],          // ★ 필수: 이미지 URL 배열
  // 레이아웃
  spacing: 3.4, planeW: 2.3, planeH: 3.05, segments: 24, repeat: 3,
  // 카메라(원근 = 깊이의 토대)
  fov: 42, camZ: 5.2,
  // 스크롤 물리(관성)
  wheelScale: 0.0022, lerp: 0.085, maxVel: 2.6, velGain: 9,
  // ★ 변형 다이얼(원본 uniform 1:1)
  curve: 0.55,      // uCurveStrength : 스크롤 시 출렁임
  curveFreq: 0.42,  // uCurveFrequency: 파도 촘촘함
  depth: 0.055,     // uDepthCurveStrength: 상시 깊이 곡률
  velDepth: 0.9,    // 속도가 붙을 때 깊이 가중
  chromatic: 0.018, // 속도 기반 RGB 색수차(운동 잔상)
  // 기타
  background: 0x0c0c0e, parallax: true, autoStart: true, pauseWhenHidden: true,
};

const VERT = /* glsl */`
  uniform float uVelocity, uCurve, uCurveFreq, uDepth, uVelDepth;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    float wx = world.x;
    world.z -= wx * wx * uDepth;                            // ① 상시 깊이 곡률
    float v = uVelocity;
    world.y += sin(wx * uCurveFreq) * uCurve * v;           // ② 속도가 만드는 파도
    world.z += cos(wx * uCurveFreq) * uCurve * uVelDepth * v;
    gl_Position = projectionMatrix * viewMatrix * world;
  }`;
const FRAG = /* glsl */`
  uniform sampler2D uMap; uniform float uVelocity, uChroma;
  varying vec2 vUv;
  void main() {
    float sh = clamp(uVelocity, -1.0, 1.0) * uChroma;       // 색수차
    vec4 c = texture2D(uMap, vUv);
    c.r = texture2D(uMap, vUv + vec2(sh, 0.0)).r;
    c.b = texture2D(uMap, vUv - vec2(sh, 0.0)).b;
    gl_FragColor = c;
  }`;

export class DepthScroll {
  /**
   * @param {HTMLElement|string} container 마운트 대상
   * @param {Partial<typeof DEFAULTS>} options  (images 필수)
   */
  constructor(container, options = {}) {
    this.el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.el) throw new Error('[depth-scroll] container not found');
    this.opt = Object.assign({}, DEFAULTS, options);
    this._running = false; this._raf = null; this._visible = true;
    this.target = 0; this.current = 0; this.prev = 0; this.vel = 0; this.mx = 0; this.my = 0;
    this.meshes = [];
    this._init();
  }

  _init() {
    const o = this.opt;
    if (getComputedStyle(this.el).position === 'static') this.el.style.position = 'relative';
    this.W = this.el.offsetWidth || window.innerWidth;
    this.H = this.el.offsetHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    if (o.background != null) this.scene.background = new THREE.Color(o.background);
    this.camera = new THREE.PerspectiveCamera(o.fov, this.W / this.H, 0.1, 100);
    this.camera.position.z = o.camZ;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: o.background == null });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.W, this.H);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    Object.assign(this.renderer.domElement.style,
      { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
    this.el.appendChild(this.renderer.domElement);

    this.geo = new THREE.PlaneGeometry(o.planeW, o.planeH, o.segments, 1);
    this.loader = new THREE.TextureLoader();
    const imgs = o.images;
    if (!imgs.length) console.warn('[depth-scroll] options.images 가 비었습니다.');
    this.count = imgs.length * o.repeat;
    this.total = this.count * o.spacing;
    for (let i = 0; i < this.count; i++) {
      const tex = this.loader.load(imgs[i % imgs.length]);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        uniforms: {
          uMap: { value: tex }, uVelocity: { value: 0 },
          uCurve: { value: o.curve }, uCurveFreq: { value: o.curveFreq },
          uDepth: { value: o.depth }, uVelDepth: { value: o.velDepth }, uChroma: { value: o.chromatic },
        },
      });
      const m = new THREE.Mesh(this.geo, mat);
      m.userData.base = i * o.spacing;
      this.scene.add(m); this.meshes.push(m);
    }

    // 이벤트
    this._onWheel = (e) => { this.target += e.deltaY * o.wheelScale; };
    this._onMove = (e) => { const p = e.touches ? e.touches[0] : e; if (!p) return; this.mx = p.clientX / window.innerWidth - 0.5; this.my = p.clientY / window.innerHeight - 0.5; };
    this._onDown = (e) => { this._down = true; this._sx = e.clientX; this._st = this.target; };
    this._onDrag = (e) => { if (this._down) this.target = this._st - (e.clientX - this._sx) * 0.01; };
    this._onUp = () => { this._down = false; };
    this._onResize = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.resize(), 180); };
    this.el.addEventListener('wheel', this._onWheel, { passive: true });
    this.el.addEventListener('pointermove', this._onMove, { passive: true });
    this.el.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onDrag);
    window.addEventListener('pointerup', this._onUp);
    window.addEventListener('resize', this._onResize);

    if (o.pauseWhenHidden && 'IntersectionObserver' in window) {
      this._io = new IntersectionObserver(([en]) => { this._visible = en.isIntersecting; }, { threshold: 0 });
      this._io.observe(this.el);
    }
    if (o.autoStart) this.start();
  }

  _wrap(x) { const t = this.total; x = ((x % t) + t) % t; if (x > t / 2) x -= t; return x; }

  _frame = () => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._frame);
    if (!this._visible) return;
    const o = this.opt;
    this.current += (this.target - this.current) * o.lerp;
    const fv = this.current - this.prev; this.prev = this.current;
    const clamped = Math.max(-o.maxVel, Math.min(o.maxVel, fv * o.velGain));
    this.vel += (clamped - this.vel) * 0.15;
    for (const m of this.meshes) {
      m.position.x = this._wrap(m.userData.base - this.current);
      m.material.uniforms.uVelocity.value = this.vel;
    }
    if (o.parallax) {
      this.camera.position.x += (this.mx * 0.6 - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.my * 0.4 - this.camera.position.y) * 0.05;
    }
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  };

  /* 라이프사이클 */
  start() { if (this._running) return this; this._running = true; this._raf = requestAnimationFrame(this._frame); return this; }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; return this; }
  resize() { this.W = this.el.offsetWidth; this.H = this.el.offsetHeight; this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix(); this.renderer.setSize(this.W, this.H); return this; }
  setOptions(p = {}) {
    Object.assign(this.opt, p);
    for (const m of this.meshes) {
      const u = m.material.uniforms;
      u.uCurve.value = this.opt.curve; u.uCurveFreq.value = this.opt.curveFreq;
      u.uDepth.value = this.opt.depth; u.uVelDepth.value = this.opt.velDepth; u.uChroma.value = this.opt.chromatic;
    }
    return this;
  }
  destroy() {
    this.stop();
    this.el.removeEventListener('wheel', this._onWheel);
    this.el.removeEventListener('pointermove', this._onMove);
    this.el.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onDrag);
    window.removeEventListener('pointerup', this._onUp);
    window.removeEventListener('resize', this._onResize);
    this._io?.disconnect();
    for (const m of this.meshes) { m.material.uniforms.uMap.value?.dispose?.(); m.material.dispose(); }
    this.geo?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement?.parentNode?.removeChild(this.renderer.domElement);
  }
}
export default DepthScroll;
