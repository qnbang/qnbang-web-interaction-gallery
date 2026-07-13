/**
 * GalleryDolly — 스크롤로 카메라가 Z축을 '돌리인'하며 흩뿌려진 이미지 카드 필드를 비행하는 3D 갤러리.
 *
 * 이미지들을 카메라 정면 Z 깊이축에 산포(좌우·상하 + 카드별 크기 강약)해 화면에 여러 장이 동시에 보인다:
 * 뒤(먼 곳)는 작고 흐리게 → 스크롤로 당겨지면 커지고 또렷 → 카메라를 스쳐 지나며 디졸브.
 * 카드는 종이처럼 굽이치고(정점 셰이더) 모서리 라운드 마스크(프래그먼트 SDF).
 *
 * 스크롤 구동: 페이지가 setProgress(0~1)로 카메라 목표 z를 주고, 내부 rAF가 lerp로 관성 추종.
 *
 * 출처: 큐앤뱅 리믹스6 갤러리 섹션(effects/gallery-3d-scroll.js)에서 추출. 의존 `window.QNB`는 lowPower 옵션으로 일반화.
 */
import * as THREE from "three";

const DEFAULTS = {
  images: [], // ★ 필수: 이미지 URL 배열
  minPlanes: 15, // 화면을 채울 최소 카드 수(입력이 적으면 순환 복제)
  fov: 54,
  gapZ: 3.2, // 카드 사이 Z 간격(작을수록 빽빽)
  planeH: 1.45, // 카드 기본 월드 높이
  aspect: 4 / 3, // 카드 가로:세로
  scaleMin: 0.5, // 카드 크기 강약(최소 배율)
  scaleMax: 1.08, // 카드 크기 강약(최대 배율)
  xSpread: 2.3, // 좌우 산포 범위
  ySpread: 1.55, // 상하 산포 범위
  cornerRadius: 0, // 카드 둥근 모서리(0=직각, 0.085 등으로 둥글게)
  focusDist: 4.5, // 카메라 앞 초점 거리
  fadeSpan: 9.0, // 초점보다 이만큼 멀면 사라짐(먼 곳 페이드인 구간)
  passFade: 2.2, // 카메라에 이만큼 가까우면 디졸브 시작
  startZ: 6.0, // 카메라 시작 z
  endPad: 3.0, // 마지막 카드 통과 후 여유 트랙
  transparent: true, // 투명 캔버스(섹션 배경이 비침)
  void: 0x0a0a0a, // fog 수렴색(=섹션 배경)
  fog: [6.0, 20.0], // 거리 안개 near/far (null이면 끔)
  lerp: 0.085, // 카메라 추종 관성
  parallax: 0.5, // 마우스 미세 시차(0이면 끔)
  flutterGain: 5.5, flutterMax: 0.16, flutterFreq: 1.25, flutterSpeed: 3.6,
  stretchGain: 5, stretchMax: 0.05,
  segX: 32, segY: 20, // 면 분할
  lowPower: null, // null=자동(window.QNB.device.isLowPower 있으면 사용) / true·false 강제
  autoStart: true,
  pauseWhenHidden: true,
};

/* 종이 펄럭임 셰이더(정점) + 둥근 모서리(프래그먼트). 표준 cloth-wave 독립 구현. */
const VERT = /* glsl */ `
  uniform float uVel, uTime, uAmp, uAmpMax, uFreq, uSpeed;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float a = abs(uVel);
    float amp = min(a * uAmp, uAmpMax);
    float ph = p.x * uFreq + uTime * uSpeed;
    p.z += sin(ph) * amp;
    p.z += cos(p.y * uFreq * 0.7 - uTime * uSpeed * 0.8) * amp * 0.45;
    p.y += sin(ph * 0.85) * amp * 0.12;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }`;
const FRAG = /* glsl */ `
  uniform sampler2D uMap; uniform float uOpacity, uRadius, uAspect;
  varying vec2 vUv;
  void main() {
    if (uOpacity <= 0.002) discard;
    vec2 pos = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 halfb = vec2(uAspect, 1.0) * 0.5;
    vec2 q = abs(pos) - (halfb - uRadius);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float mask = 1.0 - smoothstep(0.0, 0.006, d);
    if (mask <= 0.001) discard;
    vec4 c = texture2D(uMap, vUv);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity * mask);
  }`;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const frac = (x) => x - Math.floor(x);

export class GalleryDolly {
  /**
   * @param {HTMLElement|string} container
   * @param {Partial<typeof DEFAULTS>} options  (images 필수)
   */
  constructor(container, options = {}) {
    this.el = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.el) throw new Error("[gallery-3d-scroll] container not found");
    this.opt = Object.assign({}, DEFAULTS, options);
    this._running = false; this._raf = null; this._visible = true;
    this.progress = 0;
    this.mx = 0; this.my = 0;
    this.planes = [];
    this.focusedIndex = -1;
    this.onFocus = null; // (index) => void — 초점 카드 변경 콜백
    this._init();
  }

  _init() {
    const o = this.opt;
    if (getComputedStyle(this.el).position === "static") this.el.style.position = "relative";
    this.W = this.el.offsetWidth || window.innerWidth;
    this.H = this.el.offsetHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    if (!o.transparent) this.scene.background = new THREE.Color(o.void);
    if (o.fog) this.scene.fog = new THREE.Fog(o.void, o.fog[0], o.fog[1]);

    this.camera = new THREE.PerspectiveCamera(o.fov, this.W / this.H, 0.1, 200);
    this.camera.position.set(0, 0, o.startZ);

    // 저사양 경량화 — 옵션 lowPower 우선, 없으면 window.QNB.device, 그것도 없으면 false
    const _lowp = o.lowPower != null ? !!o.lowPower
      : !!(window.QNB && window.QNB.device && window.QNB.device.isLowPower);
    this.renderer = new THREE.WebGLRenderer({ antialias: !_lowp, alpha: !!o.transparent });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, _lowp ? 1.25 : 2));
    this.renderer.setSize(this.W, this.H);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    Object.assign(this.renderer.domElement.style,
      { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    this.el.appendChild(this.renderer.domElement);

    const planeW = o.planeH * o.aspect;
    const _segX = _lowp ? Math.max(8, o.segX >> 1) : o.segX;
    const _segY = _lowp ? Math.max(6, o.segY >> 1) : o.segY;
    this.geo = new THREE.PlaneGeometry(planeW, o.planeH, _segX, _segY);
    this.loader = new THREE.TextureLoader();

    const src = o.images && o.images.length ? o.images : [];
    const count = Math.max(src.length, o.minPlanes || src.length);
    const texCache = {};
    const getTex = (url) => {
      if (!texCache[url]) {
        const t = this.loader.load(url);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = this.renderer.capabilities.getMaxAnisotropy?.() || 1;
        texCache[url] = t;
      }
      return texCache[url];
    };

    this.count = count;
    for (let i = 0; i < count; i++) {
      const url = src.length ? src[i % src.length] : null;
      const tex = url ? getTex(url) : null;
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, depthWrite: false,
        uniforms: {
          uMap: { value: tex }, uOpacity: { value: 0 },
          uVel: { value: 0 }, uTime: { value: 0 },
          uAmp: { value: o.flutterGain }, uAmpMax: { value: o.flutterMax },
          uFreq: { value: o.flutterFreq }, uSpeed: { value: o.flutterSpeed },
          uRadius: { value: o.cornerRadius }, uAspect: { value: o.aspect },
        },
      });
      const m = new THREE.Mesh(this.geo, mat);
      // 위치 산포 + 크기 강약 — 저불일치(irrational) 수열로 결정적·고른 분포
      const rx = frac((i + 1) * 0.7548776662467);
      const ry = frac((i + 1) * 0.569840290998);
      const rs = frac((i + 1) * 0.6180339887499);
      m.userData.baseX = (rx - 0.5) * 2 * o.xSpread;
      m.userData.baseY = (ry - 0.5) * 2 * o.ySpread;
      m.userData.baseZ = -(i + 1) * o.gapZ;
      m.userData.scaleMul = o.scaleMin + rs * (o.scaleMax - o.scaleMin);
      m.position.set(m.userData.baseX, m.userData.baseY, m.userData.baseZ);
      const s0 = m.userData.scaleMul;
      m.scale.set(s0, s0, 1);
      this.scene.add(m);
      this.planes.push(m);
    }
    this.trackLen = count * o.gapZ + o.focusDist + o.endPad;

    this._onMove = (e) => {
      const p = e.touches ? e.touches[0] : e; if (!p) return;
      this.mx = p.clientX / window.innerWidth - 0.5;
      this.my = p.clientY / window.innerHeight - 0.5;
    };
    this._onResize = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.resize(), 160); };
    window.addEventListener("pointermove", this._onMove, { passive: true });
    window.addEventListener("resize", this._onResize);

    if (o.pauseWhenHidden && "IntersectionObserver" in window) {
      this._io = new IntersectionObserver(([en]) => { this._visible = en.isIntersecting; }, { threshold: 0 });
      this._io.observe(this.el);
    }

    this._targetCamZ = o.startZ;
    this._camZ = o.startZ;
    this._prevCamZ = o.startZ;
    this._vz = 0;
    if (o.autoStart) this.start();
  }

  /** 스크롤 진행(0~1) → 카메라 목표 z. 내부 rAF가 lerp로 부드럽게 따라간다. */
  setProgress(p) {
    this.progress = clamp01(p);
    this._targetCamZ = this.opt.startZ - this.progress * this.trackLen;
    return this;
  }

  _frame = (t) => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._frame);
    if (!this._visible) return;
    const o = this.opt;
    const time = (t || 0) * 0.001;

    this._camZ += (this._targetCamZ - this._camZ) * o.lerp;
    this.camera.position.z = this._camZ;

    const dz = this._camZ - this._prevCamZ;
    this._prevCamZ = this._camZ;
    this._vz += (dz - this._vz) * 0.25;
    const vAbs = Math.abs(this._vz);
    const st = Math.min(vAbs * o.stretchGain, o.stretchMax);
    const sx = 1 - st * 0.6, sy = 1 + st;

    if (o.parallax) {
      this.camera.position.x += (this.mx * o.parallax - this.camera.position.x) * 0.05;
      this.camera.position.y += (-this.my * o.parallax - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, this._camZ - o.focusDist);
    }

    const focusDist = o.focusDist, fadeSpan = o.fadeSpan, passFade = o.passFade;
    let bestIdx = -1, bestOp = 0.08;
    for (let i = 0; i < this.planes.length; i++) {
      const m = this.planes[i];
      const dist = this._camZ - m.userData.baseZ;
      let op = 0;
      if (dist > 0 && dist < focusDist + fadeSpan) {
        const inFade = clamp01((focusDist + fadeSpan - dist) / fadeSpan);
        const outFade = dist < passFade ? clamp01(dist / passFade) : 1;
        op = inFade * outFade;
      }
      const u = m.material.uniforms;
      u.uOpacity.value = op;
      u.uVel.value = this._vz;
      u.uTime.value = time;
      m.visible = op > 0.003;
      const sm = m.userData.scaleMul;
      m.scale.set(sm * sx, sm * sy, 1);
      if (op > bestOp) { bestOp = op; bestIdx = i; }
    }
    if (bestIdx !== this.focusedIndex) {
      this.focusedIndex = bestIdx;
      if (typeof this.onFocus === "function") this.onFocus(bestIdx);
    }

    this.renderer.render(this.scene, this.camera);
  };

  start() { if (this._running) return this; this._running = true; this._raf = requestAnimationFrame(this._frame); return this; }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; return this; }
  resize() {
    this.W = this.el.offsetWidth; this.H = this.el.offsetHeight;
    this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.W, this.H);
    return this;
  }
  setOptions(p = {}) { Object.assign(this.opt, p); return this; }
  destroy() {
    this.stop();
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("resize", this._onResize);
    this._io?.disconnect();
    const disposed = new Set();
    for (const m of this.planes) {
      const tx = m.material.uniforms?.uMap?.value;
      if (tx && !disposed.has(tx)) { tx.dispose?.(); disposed.add(tx); }
      m.material.dispose();
    }
    this.geo?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement?.parentNode?.removeChild(this.renderer.domElement);
  }
}
export default GalleryDolly;
