/**
 * ParticleMorph — 3D 메시(GLTF 또는 구체) 표면을 발광 점구름으로 샘플해, 평상시 천천히 회전하는 '꽉 찬 구'가
 * 활성 시 '파티클 링(스트로크 원)'으로 부드럽게 모핑(바운스 없는 지수보간)되고 시계방향으로 도는 효과.
 *
 *  - 점구름: GLB 표면을 면적 가중으로 N개 점 샘플(법선 셰이딩 + 가산 발광 + 거리 감쇠).
 *  - 평상시(morph=0): 랜덤축으로 천천히 회전하는 구.
 *  - 활성(morph=1): 입자들이 안~밖 반경 사이의 띠(링)로 모핑, Z축 둘레 시계방향 회전. 중앙(링 안)이 비어 버튼 등을 둘 수 있다.
 *  - 활성 트리거: hoverActivate(중앙 근접 자동) 또는 외부 setActive(on)/onActiveChange 콜백.
 *
 * 출처: 큐앤뱅 리믹스6 푸터 블루베리 입자(footer-blueberry-3d.js)에서 일반화 추출.
 *       페이지 훅(DOM ID·footer visibility·'footerberry:*' 이벤트·모바일 탭 토글)은 제거하고
 *       container 인자 + setActive/onActiveChange + 옵션으로 대체. window.QNB.device → lowPower 옵션.
 */
import * as THREE from "three";

const DEFAULTS = {
  count: 60000, // 입자 수(저사양 자동 감축)
  berryScale: 1.55, // 점구름 크기
  camDist: 6.4, fov: 38,
  color: 0xb9c6ff, // 입자 색(가산 글로우)
  pointSize: 3.0, // 점 크기(px, DPR 전)
  spin: 0.16, // 평상시(구) 회전 속도(rad/s)
  morphEase: 0.09, // 구↔링 모핑 보간(지수)
  ringInner: 1.4, ringOuter: 1.9, ringZ: 0.16, // 링 반경·두께
  ringSpin: 0.07, // 링 회전 속도(rad/s, 시계방향)
  activeR: 0.3, // hoverActivate: 화면 중앙에서 이 반경(min(W,H)×값) 안이면 활성
  hoverActivate: true, // true=중앙 근접으로 자동 활성 / false=setActive로만
  modelUrl: null, // GLTF URL (없으면 구체 점구름)
  lowPower: null, // null=자동(window.QNB.device) / true·false
  autoStart: true,
  pauseWhenHidden: true,
};

export class ParticleMorph {
  /**
   * @param {HTMLElement|string} container
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(container, options = {}) {
    this.el = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.el) throw new Error("[particle-morph] container not found");
    this.C = Object.assign({}, DEFAULTS, options);
    this._running = false; this._raf = 0; this._visible = true;
    this._N = 0; this._morph = 0; this._ringAngle = 0; this._angle = 0;
    this._active = false;
    this.onActiveChange = null; // (active:boolean) => void
    this._init();
  }

  _init() {
    const C = this.C;
    if (getComputedStyle(this.el).position === "static") this.el.style.position = "relative";
    this._lowp = C.lowPower != null ? !!C.lowPower
      : !!(window.QNB && window.QNB.device && window.QNB.device.isLowPower);
    if (this._lowp) C.count = Math.min(C.count, 20000);

    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    this.el.appendChild(this.canvas);

    this.W = this.el.clientWidth || window.innerWidth;
    this.H = this.el.clientHeight || window.innerHeight;
    const PR = Math.min(window.devicePixelRatio || 1, this._lowp ? 1.25 : 2);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(PR);
    this.renderer.setSize(this.W, this.H, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(C.fov, this.W / this.H, 0.1, 100);
    this.camera.position.set(0, 0, C.camDist); this.camera.lookAt(0, 0, 0);

    this.material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(C.color) }, uSize: { value: C.pointSize }, uPR: { value: PR }, uOpacity: { value: 1 } },
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aVar;
        attribute float aBright;
        uniform float uSize; uniform float uPR;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vA = (0.14 + aVar * 0.32) * (0.2 + 0.8 * aBright);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * uPR * (0.7 + aVar * 0.6) * (8.0 / -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        precision mediump float;
        uniform vec3 uColor; uniform float uOpacity;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA * uOpacity);
        }`,
    });

    this._q = new THREE.Quaternion();
    this._spinAxis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    if (this._spinAxis.lengthSq() < 1e-6) this._spinAxis.set(0, 1, 0);
    this._spinAxis.normalize();
    this._Lc = new THREE.Vector3(0, -0.8, 0.6).normalize();
    this._rn = new THREE.Vector3(); this._tmp = new THREE.Vector3();

    this._mx = -9999; this._my = -9999; this._mIn = false;
    this._onMove = (e) => { this._mx = e.clientX; this._my = e.clientY; this._mIn = true; };
    this._onLeave = () => { this._mx = this._my = -9999; this._mIn = false; };
    window.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerleave", this._onLeave);
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    if (C.pauseWhenHidden && "IntersectionObserver" in window) {
      this._io = new IntersectionObserver(([en]) => { this._visible = en.isIntersecting; }, { threshold: 0 });
      this._io.observe(this.el);
    }

    this._loadGeometry();
    this._last = performance.now();
    this._frame = (now) => {
      this._raf = requestAnimationFrame(this._frame);
      if (!this._running) return;
      if (!this._N || !this._visible) { this._last = now; return; }
      this._step(now);
    };
    if (C.autoStart) this.start();
  }

  async _loadGeometry() {
    const C = this.C;
    if (C.modelUrl) {
      try {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const gltf = await new Promise((res, rej) => new GLTFLoader().load(C.modelUrl, res, undefined, rej));
        let src = null; gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
        if (src) { this._buildFromGeometry(src.geometry.clone()); return; }
      } catch (e) { /* 폴백 */ }
    }
    this._buildFromGeometry(new THREE.SphereGeometry(1, 64, 48));
  }

  _buildFromGeometry(g) {
    const C = this.C;
    g.computeBoundingSphere();
    const c = g.boundingSphere.center, s = 1 / g.boundingSphere.radius;
    g.translate(-c.x, -c.y, -c.z); g.scale(s, s, s);
    if (!g.attributes.normal) g.computeVertexNormals();
    const P = g.attributes.position, Nm = g.attributes.normal, idx = g.index;
    const tri = idx ? idx.count / 3 : P.count / 3;
    const gi = (i) => (idx ? idx.getX(i) : i);
    const a = new THREE.Vector3(), b = new THREE.Vector3(), cc = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
    const areas = new Float32Array(tri); let total = 0;
    for (let t = 0; t < tri; t++) {
      a.fromBufferAttribute(P, gi(3 * t)); b.fromBufferAttribute(P, gi(3 * t + 1)); cc.fromBufferAttribute(P, gi(3 * t + 2));
      e1.subVectors(b, a); e2.subVectors(cc, a);
      const ar = e1.cross(e2).length() * 0.5; areas[t] = ar; total += ar;
    }
    const N = (this._N = C.count);
    this._home = new Float32Array(N * 3); this._norm = new Float32Array(N * 3);
    this._pos = new Float32Array(N * 3); this._ringT = new Float32Array(N * 3);
    this._aBright = new Float32Array(N).fill(0.5);
    const aVar = new Float32Array(N);
    const na = new THREE.Vector3(), nb = new THREE.Vector3(), nc2 = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      let rnd = Math.random() * total, t = 0; while (t < tri - 1 && rnd > areas[t]) { rnd -= areas[t]; t++; }
      a.fromBufferAttribute(P, gi(3 * t)); b.fromBufferAttribute(P, gi(3 * t + 1)); cc.fromBufferAttribute(P, gi(3 * t + 2));
      na.fromBufferAttribute(Nm, gi(3 * t)); nb.fromBufferAttribute(Nm, gi(3 * t + 1)); nc2.fromBufferAttribute(Nm, gi(3 * t + 2));
      let u = Math.random(), v = Math.random(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      const px = (a.x * w + b.x * u + cc.x * v) * C.berryScale;
      const py = (a.y * w + b.y * u + cc.y * v) * C.berryScale;
      const pz = (a.z * w + b.z * u + cc.z * v) * C.berryScale;
      const i3 = i * 3;
      this._home[i3] = px; this._home[i3 + 1] = py; this._home[i3 + 2] = pz;
      const nx = na.x * w + nb.x * u + nc2.x * v, ny = na.y * w + nb.y * u + nc2.y * v, nz = na.z * w + nb.z * u + nc2.z * v;
      const nl = Math.hypot(nx, ny, nz) || 1;
      this._norm[i3] = nx / nl; this._norm[i3 + 1] = ny / nl; this._norm[i3 + 2] = nz / nl;
      this._pos[i3] = px; this._pos[i3 + 1] = py; this._pos[i3 + 2] = pz;
      aVar[i] = Math.random();
      const th = Math.random() * Math.PI * 2;
      const rho = Math.sqrt(C.ringInner * C.ringInner + Math.random() * (C.ringOuter * C.ringOuter - C.ringInner * C.ringInner));
      this._ringT[i3] = Math.cos(th) * rho; this._ringT[i3 + 1] = Math.sin(th) * rho; this._ringT[i3 + 2] = (Math.random() - 0.5) * C.ringZ;
    }
    this._geom = new THREE.BufferGeometry();
    this._geom.setAttribute("position", new THREE.BufferAttribute(this._pos, 3).setUsage(THREE.DynamicDrawUsage));
    this._geom.setAttribute("aVar", new THREE.BufferAttribute(aVar, 1));
    this._geom.setAttribute("aBright", new THREE.BufferAttribute(this._aBright, 1).setUsage(THREE.DynamicDrawUsage));
    this._points = new THREE.Points(this._geom, this.material);
    this._points.frustumCulled = false;
    this.scene.add(this._points);
    this.resize();
  }

  _setActiveInternal(on) {
    if (on === this._active) return;
    this._active = on;
    if (typeof this.onActiveChange === "function") this.onActiveChange(on);
  }

  /** 외부에서 활성/비활성 제어(hoverActivate=false일 때 또는 강제) */
  setActive(on) { this._setActiveInternal(!!on); return this; }
  get active() { return this._active; }

  _step(now) {
    const C = this.C;
    let dt = (now - this._last) / 1000; if (dt > 0.05) dt = 0.05; this._last = now;
    this._angle += C.spin * dt;
    this._q.setFromAxisAngle(this._spinAxis, this._angle);
    this._ringAngle += C.ringSpin * dt;

    if (C.hoverActivate) {
      this._tmp.set(0, 0, 0).project(this.camera);
      const cxs = (this._tmp.x * 0.5 + 0.5) * this.W, cys = (-this._tmp.y * 0.5 + 0.5) * this.H;
      const minDim = Math.min(this.W, this.H);
      this._setActiveInternal(this._mIn && Math.hypot(this._mx - cxs, this._my - cys) < minDim * C.activeR);
    }

    this._morph += ((this._active ? 1 : 0) - this._morph) * C.morphEase;
    const m = this._morph;
    const ca = Math.cos(-this._ringAngle), sa = Math.sin(-this._ringAngle);
    const home = this._home, norm = this._norm, pos = this._pos, ringT = this._ringT, aBright = this._aBright, Lc = this._Lc, q = this._q, rn = this._rn, N = this._N;

    for (let i = 0; i < N; i++) {
      const i3 = i * 3, i31 = i3 + 1, i32 = i3 + 2;
      rn.set(home[i3], home[i31], home[i32]).applyQuaternion(q);
      const sx = rn.x, sy = rn.y, sz = rn.z;
      rn.set(norm[i3], norm[i31], norm[i32]).applyQuaternion(q);
      let bb = rn.x * Lc.x + rn.y * Lc.y + rn.z * Lc.z; if (bb < 0) bb = 0;
      aBright[i] = bb;
      const rtx = ringT[i3], rty = ringT[i31];
      const rx = rtx * ca - rty * sa, ry = rtx * sa + rty * ca, rz = ringT[i32];
      pos[i3] = sx + (rx - sx) * m;
      pos[i31] = sy + (ry - sy) * m;
      pos[i32] = sz + (rz - sz) * m;
    }
    this._geom.attributes.position.needsUpdate = true;
    this._geom.attributes.aBright.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  start() { if (this._running) return this; this._running = true; this._last = performance.now(); this._raf = requestAnimationFrame(this._frame); return this; }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; return this; }
  resize() {
    this.W = this.canvas.clientWidth || window.innerWidth; this.H = this.canvas.clientHeight || window.innerHeight;
    if (!this.W || !this.H) return this;
    this.renderer.setSize(this.W, this.H, false); this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
    return this;
  }
  setOptions(p = {}) { Object.assign(this.C, p); return this; }
  destroy() {
    this.stop();
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerleave", this._onLeave);
    window.removeEventListener("resize", this._onResize);
    this._io?.disconnect();
    this._geom?.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
    this.canvas?.parentNode?.removeChild(this.canvas);
  }
}
export default ParticleMorph;
