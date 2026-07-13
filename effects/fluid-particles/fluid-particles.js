/**
 * fluid-particles.js — 마우스 유체 인터랙션 파티클 엔진
 * ----------------------------------------------------------------------------
 * 텍스트/이미지/좌표를 입자 군집으로 만들고, 마우스가 움직이면 그 "이동 속도"를
 * 격자 속도장(grid velocity field)에 주입해 유체처럼 흐르게 한다. 입자는 그 흐름을
 * 타고 마우스가 움직인 방향으로 끌려가 따라 이동하다가, 잠잠해지면 제자리로 복귀한다.
 *
 * 렌더링은 Three.js GPU 포인트(가산 블렌딩 옵션) — 겹치면 발광한다.
 * 물리는 CPU 격자 유체 시뮬레이션(Stam 계열 속도장 + 이류 + 스프링 복귀).
 *
 * 의존성: three (peer). 소비측에서 importmap/번들러로 'three'를 제공한다.
 *
 * @example
 *   import { FluidParticles } from './lib/fluid-particles.js';
 *   const fx = new FluidParticles('#stage', {
 *     text: { lines: ['start', 'with', 'mix.'] },
 *     color: '#ffffff', blending: 'additive',
 *   });
 *   // fx.stop(); fx.start(); fx.destroy();
 */
import * as THREE from 'three';

/** @typedef {Object} FluidParticlesOptions */
const DEFAULTS = {
  // ── 입자 소스 (text | image | points 중 하나) ──────────────────────────────
  /** 텍스트 소스. {lines, fontWeight, fontFamily, fontScale, lineHeight} */
  text: null,
  /** 이미지 소스. {src, threshold(0-255), fit:'contain'|'cover', scale} */
  image: null,
  /** 직접 좌표. [{x,y}] — normalized=true면 0..1, 아니면 픽셀 */
  points: null,
  /** points가 0..1 정규화 좌표인지 */
  normalized: false,
  /** 픽셀 샘플 간격(작을수록 조밀·무거움). 모바일은 자동으로 +1 */
  sampleStep: 2,

  // ── 입자 외형 ──────────────────────────────────────────────────────────────
  color: '#ffffff',
  pointSize: 2.8,          // 기준 점 크기(px, DPR 적용 전)
  sizeVariation: 1.1,      // 점 크기 랜덤 가산 폭
  baseAlpha: 0.45,         // 점 기본 알파
  alphaVariation: 0.55,    // 알파 랜덤 가산 폭
  blending: 'additive',    // 'additive'(발광) | 'normal'
  background: null,        // null=투명, 예: '#000'

  // ── 유체 물리 (원본 newmix 엔진 분석값을 기본값으로) ─────────────────────────
  cellSize: 10,            // 격자 셀 크기(px)
  brushRadius: 48,         // 마우스 힘 주입 반경(px)
  injectStepPx: 6,         // 마우스 경로 보간 간격(px)
  velocityClamp: 100,      // 셀 속도 상한
  fluidDamping: 0.99,      // 셀 속도 감쇠(흐름 지속성)
  sampleStrength: 0.06,    // 입자가 받는 셀 속도 비율
  particleClamp: 30,       // 입자 속도 상한
  particleDamping: 0.4,    // 입자 속도 감쇠
  calmThreshold: 0.5,      // 이 속도 이하면 복귀 시작
  returnDelay: 0.05,       // 복귀 강도 ramp 시간(s)
  returnStrength: 50,      // 복귀 스프링 강도 계수
  floatStrength: 0.05,     // 미세 부유 진폭(0=끔)

  // ── 동작 ───────────────────────────────────────────────────────────────────
  pixelRatio: 2,           // 최대 devicePixelRatio
  autoStart: true,
  pauseWhenHidden: true,   // 화면 밖이면 IntersectionObserver로 일시정지
  pointerTarget: window,   // 포인터 이벤트를 받을 대상
};

export class FluidParticles {
  /**
   * @param {HTMLElement|string} container 마운트할 요소(또는 셀렉터)
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(container, options = {}) {
    this.el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.el) throw new Error('[FluidParticles] container not found');
    this.opt = Object.assign({}, DEFAULTS, options);

    this.W = 0; this.H = 0;
    this.N = 0;
    this._running = false;
    this._raf = null;
    this._last = 0;
    this._visible = true;
    this._ready = false;

    // 마우스(컨테이너 픽셀좌표): 현재/이전
    this._mx = -9999; this._my = -9999; this._pmx = -9999; this._pmy = -9999;

    this._initRenderer();
    this._initEvents();
    this._boot();
  }

  /* ────────────────────────── 초기화 ────────────────────────── */
  _initRenderer() {
    const r = this.renderer = new THREE.WebGLRenderer({ alpha: !this.opt.background, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.opt.pixelRatio));
    r.setClearColor(new THREE.Color(this.opt.background || '#000000'), this.opt.background ? 1 : 0);
    const cv = r.domElement;
    Object.assign(cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' });
    if (getComputedStyle(this.el).position === 'static') this.el.style.position = 'relative';
    this.el.appendChild(cv);

    this.scene = new THREE.Scene();
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 1 },
        uSize: { value: this.opt.pointSize },
        uColor: { value: new THREE.Color(this.opt.color) },
      },
      transparent: true, depthTest: false, depthWrite: false,
      blending: this.opt.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: /* glsl */`
        attribute float aVar;
        uniform float uSize;
        varying float vA;
        void main() {
          vA = ${f(this.opt.baseAlpha)} + aVar * ${f(this.opt.alphaVariation)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (0.8 + aVar * ${f(this.opt.sizeVariation)});
        }`,
      fragmentShader: /* glsl */`
        precision mediump float;
        uniform float uOpacity;
        uniform vec3 uColor;
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA * uOpacity);
        }`,
    });
  }

  _initEvents() {
    const t = this.opt.pointerTarget;
    this._onMove = (e) => {
      const p = e.touches ? e.touches[0] : e;
      if (!p) return;
      const r = this.el.getBoundingClientRect();
      this._mx = (p.clientX - r.left) / r.width * this.W;
      this._my = (p.clientY - r.top) / r.height * this.H;
      if (this._pmx < -9000) { this._pmx = this._mx; this._pmy = this._my; }
    };
    this._onLeave = () => { this._mx = this._my = this._pmx = this._pmy = -9999; };
    this._onResize = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.resize(), 250); };
    t.addEventListener('mousemove', this._onMove, { passive: true });
    t.addEventListener('touchmove', this._onMove, { passive: true });
    t.addEventListener('touchend', this._onLeave, { passive: true });
    document.addEventListener('mouseleave', this._onLeave);
    window.addEventListener('resize', this._onResize);

    if (this.opt.pauseWhenHidden && 'IntersectionObserver' in window) {
      this._io = new IntersectionObserver(([en]) => { this._visible = en.isIntersecting; }, { threshold: 0 });
      this._io.observe(this.el);
    }
  }

  async _boot() {
    // 폰트 로딩을 기다려 텍스트 글리프 정확도 확보
    try { if (document.fonts?.ready) await document.fonts.ready; } catch (_) {}
    const flat = await this._sampleSource();
    this._homePts = flat;
    this._build();
    this._ready = true;
    this._last = performance.now();
    if (this.opt.autoStart) this.start();
  }

  /* ────────────────────────── 소스 샘플링 ────────────────────────── */
  /** @returns {Promise<number[]>} flat [x,y, x,y, ...] (컨테이너 픽셀좌표) */
  async _sampleSource() {
    this.W = this.el.offsetWidth; this.H = this.el.offsetHeight;
    const W = this.W, H = this.H;
    const mobile = W < 720;
    const step = this.opt.sampleStep + (mobile ? 1 : 0);

    if (this.opt.points) {
      const out = [];
      for (const p of this.opt.points) out.push(this.opt.normalized ? p.x * W : p.x, this.opt.normalized ? p.y * H : p.y);
      return out;
    }

    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const o = off.getContext('2d', { willReadFrequently: true });

    if (this.opt.image) {
      const img = await loadImage(this.opt.image.src);
      const fit = this.opt.image.fit || 'contain';
      const scale = this.opt.image.scale ?? 0.7;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const s = (fit === 'cover' ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih)) * scale;
      const dw = iw * s, dh = ih * s;
      o.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      // 기본: 텍스트
      const cfg = this.opt.text || { lines: ['fluid'] };
      const lines = cfg.lines;
      const fontScale = cfg.fontScale ?? 0.30;
      const lh = cfg.lineHeight ?? 0.86;
      const weight = cfg.fontWeight ?? 800;
      const family = cfg.fontFamily ?? '"Arial Black", "Pretendard", system-ui, sans-serif';
      const fs = Math.min(W * (cfg.widthScale ?? 0.34), H * fontScale, mobile ? 150 : (cfg.maxFont ?? 300));
      o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
      o.font = `${weight} ${fs}px ${family}`;
      const lineH = fs * lh;
      const cy = H / 2 - lineH * (lines.length - 1) / 2;
      lines.forEach((ln, i) => o.fillText(ln, W / 2, cy + i * lineH));
    }

    const thr = this.opt.image?.threshold ?? 128;
    const data = o.getImageData(0, 0, W, H).data;
    const out = [];
    for (let y = 0; y < H; y += step)
      for (let x = 0; x < W; x += step)
        if (data[(y * W + x) * 4 + 3] > thr)
          out.push(x + (Math.random() - 0.5) * step, y + (Math.random() - 0.5) * step);
    return out;
  }

  /* ────────────────────────── 빌드(격자·입자·지오메트리) ────────────────────────── */
  _build() {
    const W = this.W, H = this.H;
    this.renderer.setSize(W, H, false);
    this.camera = new THREE.OrthographicCamera(0, W, 0, H, -1000, 1000); // 픽셀좌표(좌상단 원점)

    const CELL = this.opt.cellSize;
    this.cols = Math.ceil(W / CELL); this.rows = Math.ceil(H / CELL);
    this.gvx = new Float32Array(this.cols * this.rows);
    this.gvy = new Float32Array(this.cols * this.rows);
    this.gp = new Float32Array(this.cols * this.rows);

    const flat = this._homePts;
    const N = this.N = flat.length / 2;
    this.hx = new Float32Array(N); this.hy = new Float32Array(N);
    this.px = new Float32Array(N); this.py = new Float32Array(N);
    this.vx = new Float32Array(N); this.vy = new Float32Array(N);
    this.ret = new Float32Array(N).fill(-1);
    this.positions = new Float32Array(N * 3);
    const aVar = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = flat[i * 2], y = flat[i * 2 + 1];
      this.hx[i] = x; this.hy[i] = y; this.px[i] = x; this.py[i] = y;
      this.positions[i * 3] = x; this.positions[i * 3 + 1] = y;
      aVar[i] = Math.random();
    }
    if (this.geom) this.geom.dispose();
    this.geom = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.geom.setAttribute('position', this.posAttr);
    this.geom.setAttribute('aVar', new THREE.BufferAttribute(aVar, 1));
    if (this.points) this.scene.remove(this.points);
    this.points = new THREE.Points(this.geom, this.material);
    this.scene.add(this.points);
    this.material.uniforms.uSize.value = (W < 720 ? this.opt.pointSize * 0.82 : this.opt.pointSize);
  }

  /* ────────────────────────── 물리 ────────────────────────── */
  _idx(c, r) { return c * this.rows + r; }
  _gx(c, r) { return (c >= 0 && c < this.cols && r >= 0 && r < this.rows) ? this.gvx[c * this.rows + r] : 0; }
  _gy(c, r) { return (c >= 0 && c < this.cols && r >= 0 && r < this.rows) ? this.gvy[c * this.rows + r] : 0; }
  _gp(c, r) { return (c >= 0 && c < this.cols && r >= 0 && r < this.rows) ? this.gp[c * this.rows + r] : 0; }

  /** 마우스 경로를 따라 격자에 "이동 속도"를 주입 */
  _stamp(x0, y0, x1, y1, fx, fy) {
    const CELL = this.opt.cellSize, BR = this.opt.brushRadius;
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / this.opt.injectStepPx));
    for (let s = 0; s <= steps; s++) {
      const l = s / steps, bx = x0 + (x1 - x0) * l, by = y0 + (y1 - y0) * l;
      const c0 = Math.max(0, (bx - BR) / CELL | 0), c1 = Math.min(this.cols - 1, (bx + BR) / CELL | 0);
      const r0 = Math.max(0, (by - BR) / CELL | 0), r1 = Math.min(this.rows - 1, (by + BR) / CELL | 0);
      for (let c = c0; c <= c1; c++) {
        for (let r = r0; r <= r1; r++) {
          let o = Math.hypot(c * CELL - bx, r * CELL - by);
          if (o < BR) {
            if (o < 4) o = BR;
            const w = BR / o, k = c * this.rows + r;
            this.gvx[k] += fx * w; this.gvy[k] += fy * w;
          }
        }
      }
    }
  }

  /** 유체 솔브: 발산→압력, 압력경사→속도, clamp, 감쇠 */
  _fluid() {
    const cols = this.cols, rows = this.rows, clamp = this.opt.velocityClamp, damp = this.opt.fluidDamping;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const xdiv = 0.5 * this._gx(c - 1, r - 1) + this._gx(c - 1, r) + 0.5 * this._gx(c - 1, r + 1)
        - 0.5 * this._gx(c + 1, r - 1) - this._gx(c + 1, r) - 0.5 * this._gx(c + 1, r + 1);
      const ydiv = 0.5 * this._gy(c - 1, r - 1) + this._gy(c, r - 1) + 0.5 * this._gy(c + 1, r - 1)
        - 0.5 * this._gy(c - 1, r + 1) - this._gy(c, r + 1) - 0.5 * this._gy(c + 1, r + 1);
      this.gp[c * rows + r] = (xdiv + ydiv) * 0.25;
    }
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const k = c * rows + r;
      this.gvx[k] += (0.5 * this._gp(c - 1, r - 1) + this._gp(c - 1, r) + 0.5 * this._gp(c - 1, r + 1)
        - 0.5 * this._gp(c + 1, r - 1) - this._gp(c + 1, r) - 0.5 * this._gp(c + 1, r + 1)) * 0.25;
      this.gvy[k] += (0.5 * this._gp(c - 1, r - 1) + this._gp(c, r - 1) + 0.5 * this._gp(c + 1, r - 1)
        - 0.5 * this._gp(c - 1, r + 1) - this._gp(c, r + 1) - 0.5 * this._gp(c + 1, r + 1)) * 0.25;
      const v = Math.hypot(this.gvx[k], this.gvy[k]);
      if (v > clamp) { const n = clamp / v; this.gvx[k] *= n; this.gvy[k] *= n; }
      this.gvx[k] *= damp; this.gvy[k] *= damp;
    }
  }

  _step(dt, now) {
    const o = this.opt, CELL = o.cellSize, cols = this.cols, rows = this.rows;
    const tsec = now * 0.001;

    // 1) 마우스 이동분 주입
    if (this._mx > -9000 && this._pmx > -9000) {
      const dvx = this._mx - this._pmx, dvy = this._my - this._pmy;
      if (dvx !== 0 || dvy !== 0) this._stamp(this._pmx, this._pmy, this._mx, this._my, dvx, dvy);
    }
    this._pmx = this._mx; this._pmy = this._my;

    // 2) 유체 솔브
    this._fluid();

    // 3) 잠잠하면 origin으로 스프링 복귀
    for (let i = 0; i < this.N; i++) {
      const s = Math.hypot(this.vx[i], this.vy[i]);
      if (s > o.calmThreshold) this.ret[i] = -1;
      else if (this.ret[i] < 0) this.ret[i] = tsec;
      if (this.ret[i] >= 0) {
        const n = Math.min(1, (tsec - this.ret[i]) / o.returnDelay);
        const sm = n * n * (3 - 2 * n);
        const k = o.returnStrength * dt * (0.15 + 0.85 * sm);
        this.vx[i] += (this.hx[i] - this.px[i]) * k;
        this.vy[i] += (this.hy[i] - this.py[i]) * k;
      }
    }

    // 4) 격자 속도 이류 + 미세 부유 + 적분
    const SS = o.sampleStrength, PC = o.particleClamp, PD = o.particleDamping, FL = o.floatStrength;
    for (let i = 0; i < this.N; i++) {
      let x = this.px[i], y = this.py[i];
      let c = x / CELL | 0, r = y / CELL | 0;
      if (c < 0) c = 0; else if (c > cols - 1) c = cols - 1;
      if (r < 0) r = 0; else if (r > rows - 1) r = rows - 1;
      const d = ((x % CELL) + CELL) % CELL / CELL, p = ((y % CELL) + CELL) % CELL / CELL;
      const cR = Math.min(cols - 1, c + 1), cD = Math.min(rows - 1, r + 1);
      const k = c * rows + r, kR = cR * rows + r, kD = c * rows + cD;
      this.vx[i] += ((1 - d) * this.gvx[k] + d * this.gvx[kR] + p * this.gvx[kD]) * SS;
      this.vy[i] += ((1 - p) * this.gvy[k] + d * this.gvy[kR] + p * this.gvy[kD]) * SS;
      if (FL) {
        this.vx[i] += Math.sin(tsec * 0.6 + i) * FL;
        this.vy[i] += Math.cos(tsec * 0.5 + i * 1.3) * FL;
      }
      const sp = Math.hypot(this.vx[i], this.vy[i]);
      if (sp > PC) { const nn = PC / sp; this.vx[i] *= nn; this.vy[i] *= nn; }
      x += this.vx[i]; y += this.vy[i];
      this.px[i] = x; this.py[i] = y;
      this.positions[i * 3] = x; this.positions[i * 3 + 1] = y;
      this.vx[i] *= PD; this.vy[i] *= PD;
    }
    this.posAttr.needsUpdate = true;
  }

  _frame = (now) => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._frame);
    if (!this._visible || !this._ready || !this.N) { this._last = now; return; }
    const dt = Math.min(0.05, (now - this._last) / 1000 || 0.016);
    this._last = now;
    this._step(dt, now);
    this.renderer.render(this.scene, this.camera);
  };

  /* ────────────────────────── 공개 API ────────────────────────── */
  /** 루프 시작 */
  start() { if (this._running) return; this._running = true; this._last = performance.now(); this._raf = requestAnimationFrame(this._frame); return this; }
  /** 루프 정지(상태 유지) */
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; return this; }
  /** 전체 페이드 불투명도(0~1) — 스크롤 연동 등에 사용 */
  setOpacity(v) { this.material.uniforms.uOpacity.value = v; return this; }
  /** 색상 변경 */
  setColor(c) { this.material.uniforms.uColor.value.set(c); return this; }
  /** 소스 교체 후 재빌드 */
  async setSource(srcOpts) { Object.assign(this.opt, srcOpts); this._homePts = await this._sampleSource(); this._build(); return this; }
  /** 컨테이너 크기 변화 반영(재샘플·재빌드) */
  async resize() { if (!this._ready) return; this._homePts = await this._sampleSource(); this._build(); return this; }
  /** 정리: 루프 정지·이벤트 해제·GPU 자원 해제·DOM 제거 */
  destroy() {
    this.stop();
    const t = this.opt.pointerTarget;
    t.removeEventListener('mousemove', this._onMove);
    t.removeEventListener('touchmove', this._onMove);
    t.removeEventListener('touchend', this._onLeave);
    document.removeEventListener('mouseleave', this._onLeave);
    window.removeEventListener('resize', this._onResize);
    this._io?.disconnect();
    this.geom?.dispose();
    this.material?.dispose();
    this.renderer?.dispose();
    if (this.renderer?.domElement?.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
  }
}

/* ────────────────────────── 유틸 ────────────────────────── */
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
/** GLSL 리터럴용 float 포맷(정수도 소수점 보장) */
function f(n) { const s = String(n); return s.includes('.') ? s : s + '.0'; }

export default FluidParticles;
