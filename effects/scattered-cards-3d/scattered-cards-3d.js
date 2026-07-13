/**
 * ScatteredCards3D — 여러 장의 카드가 3D 공간에 흩날려 있다가, 스크롤하면 각자 회전(텀블)하며 위로 흐른다.
 *
 * 진짜 3D(두께·조명·원근·그림자) 카드들이 깊이축(z)에 분산 배치돼 시작 상태로 떠 있고,
 * setProgress(0~1)이 진행되면 baseY + prog*rise 로 아래→위로 흐르며 spin*prog 만큼 텀블링한다.
 * 0번 카드는 옵션으로 '클라이맥스'(중앙·거의 정면·가장 큰 크기로 카메라 앞을 스침)로 둘 수 있다.
 * 등장은 '위치'로만(opacity 페이드 없음 → 번쩍임 없음). prog 는 관성 lerp 로 부드럽게.
 *
 * 출처: 큐앤뱅 리믹스6 Contact 명함 연출(cards-3d.js)에서 순수 효과만 일반화 추출.
 *       (페이지 특화였던 푸터 커튼 동기화·'Contact' 타이틀 평면은 제거 — 카드 스트림 효과만 남김.)
 */
import * as THREE from "three";

const DEFAULTS = {
  count: 19, // 카드 장수
  cardW: 8.5, cardH: 5.5, cardT: 0.14, // 카드 크기(85:55) + 두께
  paperColor: 0x4545da, // 텍스처 없을 때/옆면 색
  frontImage: null, // 앞면 텍스처 URL (없으면 단색)
  backImages: [], // 뒷면 텍스처 URL 배열(카드마다 순환, 없으면 단색)
  camZ: 23, fov: 42, // 카메라 거리·화각
  spreadX: 0.62, // 좌우 분산 폭(화면너비 대비)
  spin: 3.0, // 스크롤 동안 카드가 도는 양(rad)
  rise: 4.2, // prog 0→1 동안 위로 흐르는 양(viewH 배수)
  climax: true, // 0번 카드를 클라이맥스(중앙·정면·크게)로
  shadow: null, // null=자동(!lowPower) / true·false 강제
  lowPower: null, // null=자동(window.QNB.device) / true·false 강제
  lerp: 0.12, // prog 관성 추종(작을수록 미끄러짐)
  autoStart: true,
  pauseWhenHidden: true,
};

const R = (a, b) => a + Math.random() * (b - a);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

export class ScatteredCards3D {
  /**
   * @param {HTMLElement|string} container
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(container, options = {}) {
    this.el = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.el) throw new Error("[scattered-cards-3d] container not found");
    this.opt = Object.assign({}, DEFAULTS, options);
    this._running = false; this._raf = 0; this._visible = true;
    this._targetProg = 0; this._smoothProg = 0; this.prog = 0;
    this.cards = [];
    this._init();
  }

  _init() {
    const o = this.opt;
    if (getComputedStyle(this.el).position === "static") this.el.style.position = "relative";
    this._lowp = o.lowPower != null ? !!o.lowPower
      : !!(window.QNB && window.QNB.device && window.QNB.device.isLowPower);
    this._shadow = o.shadow != null ? !!o.shadow : !this._lowp;

    this.W = this.el.clientWidth || window.innerWidth;
    this.H = this.el.clientHeight || window.innerHeight;

    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    this.el.appendChild(this.canvas);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this._lowp ? 1.25 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = this._shadow;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.W, this.H, false);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(o.fov, this.W / this.H, 0.1, 400);
    this.camera.position.set(0, 0, o.camZ);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa0d8, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(-20, 36, 30);
    key.castShadow = this._shadow;
    if (this._shadow) {
      key.shadow.mapSize.set(1024, 1024);
      const sc = key.shadow.camera;
      sc.near = 1; sc.far = 90; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26;
      sc.updateProjectionMatrix();
      key.shadow.bias = -0.0006; key.shadow.normalBias = 0.5; key.shadow.radius = 3;
    }
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xc7d0ff, 0.5); rim.position.set(9, -5, 4); this.scene.add(rim);

    const texLoader = new THREE.TextureLoader();
    const mkMat = () => this._lowp
      ? new THREE.MeshLambertMaterial({ color: o.paperColor })
      : new THREE.MeshStandardMaterial({ color: o.paperColor, roughness: 0.92, metalness: 0.0 });
    this.paperMat = mkMat();
    this.frontMat = mkMat();
    this.backMats = (o.backImages.length ? o.backImages : [null]).map(() => mkMat());
    this._textures = [];
    const applyTex = (url, mat) => {
      if (!url) return;
      texLoader.load(encodeURI(url), (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
        mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
        this._textures.push(tex);
      }, undefined, () => {});
    };
    applyTex(o.frontImage, this.frontMat);
    o.backImages.forEach((u, k) => applyTex(u, this.backMats[k]));

    this.viewH = 2 * Math.tan((o.fov * Math.PI) / 360) * o.camZ;
    this.viewW = this.viewH * (this.W / this.H);
    const cardScale = Math.min(1, (0.55 * this.viewW) / o.cardW);
    this.geo = new THREE.BoxGeometry(o.cardW * cardScale, o.cardH * cardScale, o.cardT * cardScale);

    const N = o.count;
    for (let i = 0; i < N; i++) {
      const mats = [this.paperMat, this.paperMat, this.paperMat, this.paperMat, this.frontMat, this.backMats[i % this.backMats.length]];
      const mesh = new THREE.Mesh(this.geo, mats);
      mesh.frustumCulled = false;
      mesh.castShadow = this._shadow; mesh.receiveShadow = this._shadow;
      const isClimax = o.climax && i === 0;
      const bz = isClimax ? 14 : R(-10, 10);
      const baseY = isClimax ? -3.9 : -3.65 + ((i - 1) / Math.max(1, N - 2)) * 2.75 + R(-0.1, 0.1);
      this.cards.push({
        mesh,
        bx: isClimax ? R(-0.25, 0.25) : R(-1, 1),
        bz,
        depth: (o.camZ - bz) / o.camZ,
        baseY,
        rx0: isClimax ? R(-0.05, 0.05) : R(-Math.PI, Math.PI),
        ry0: isClimax ? R(-0.06, 0.06) : R(-Math.PI, Math.PI),
        rz0: isClimax ? R(-0.04, 0.04) : R(-Math.PI, Math.PI),
        sx: isClimax ? R(-0.09, 0.09) : R(-1, 1) * o.spin,
        sy: isClimax ? R(-0.11, 0.11) : R(-1, 1) * o.spin,
        sz: isClimax ? R(-0.05, 0.05) : R(-0.5, 0.5) * o.spin,
      });
      this.scene.add(mesh);
    }

    this._onResize = () => { clearTimeout(this._rt); this._rt = setTimeout(() => this.resize(), 160); };
    window.addEventListener("resize", this._onResize);

    if (o.pauseWhenHidden && "IntersectionObserver" in window) {
      this._io = new IntersectionObserver(([en]) => { this._visible = en.isIntersecting; }, { threshold: 0 });
      this._io.observe(this.el);
    }
    if (o.autoStart) this.start();
  }

  /** 스크롤 진행(0~1). 내부 rAF가 관성 lerp로 따라간다. */
  setProgress(p) { this._targetProg = clamp01(p); return this; }

  _update() {
    const o = this.opt;
    const sMul = this.W / this.H < 0.85 ? 0.6 : 1; // 좁은 화면: 좌우 분산 축소
    for (const c of this.cards) {
      const y = (c.baseY + this.prog * o.rise) * this.viewH;
      c.mesh.position.set(c.bx * this.viewW * o.spreadX * sMul * c.depth, y, c.bz);
      c.mesh.rotation.set(c.rx0 + c.sx * this.prog, c.ry0 + c.sy * this.prog, c.rz0 + c.sz * this.prog);
    }
  }

  _frame = () => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._frame);
    if (!this._visible) return;
    this._smoothProg += (this._targetProg - this._smoothProg) * this.opt.lerp;
    this.prog = this._smoothProg;
    this._update();
    this.renderer.render(this.scene, this.camera);
  };

  start() { if (this._running) return this; this._running = true; this._raf = requestAnimationFrame(this._frame); return this; }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; this.renderer?.clear(); return this; }
  resize() {
    this.W = this.el.clientWidth || window.innerWidth; this.H = this.el.clientHeight || window.innerHeight;
    if (!this.W || !this.H) return this;
    this.renderer.setSize(this.W, this.H, false);
    this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
    this.viewW = this.viewH * (this.W / this.H);
    return this;
  }
  setOptions(p = {}) { Object.assign(this.opt, p); return this; }
  destroy() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    this._io?.disconnect();
    for (const t of this._textures) t.dispose?.();
    [this.paperMat, this.frontMat, ...this.backMats].forEach((m) => m?.dispose?.());
    this.geo?.dispose();
    this.renderer?.dispose();
    this.canvas?.parentNode?.removeChild(this.canvas);
  }
}
export default ScatteredCards3D;
