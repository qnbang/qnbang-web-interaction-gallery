/**
 * ObjectCluster3D — 3D 오브젝트(GLTF 또는 구체) 클러스터가 방사형 버스트로 등장해 부유·텀블링하고,
 * 마우스로 밀어낼 수 있으며, 스크롤(setProgress)로 카메라가 클러스터를 꿰뚫고 통과하는 효과.
 *
 * 구성:
 *  - 보겔(해바라기) 나선으로 넓은 타원을 고르게 채워 배치(중앙=크게, 가장자리=작게).
 *  - 등장: 중앙에 모였다 제 차례에 '폭발'(방사형 버스트)하며 무중력처럼 감속·체공(stagger).
 *  - 평상시: 각자 천천히 부유 + 계속 텀블링 + 이웃과 충돌(반발). 거리 비례 복귀 스프링.
 *  - 마우스: 커서 반경 안 오브젝트를 밀어내고(push) 이동방향으로 쓸어냄(sweep) + 굴림 회전.
 *  - 스크롤: setProgress(0~1)로 카메라가 멀리서 접근 → 클러스터를 통과해 뒤로 빠짐.
 *  - 라이팅: 실시간 큐브맵 환경반사(서로 비침) + 인디고 스카이돔 IBL + 그림자 + ACES 톤매핑 + 색 그레이딩.
 *
 * 출처: 큐앤뱅 리믹스6 히어로 블루베리 클러스터(hero-blueberry-3d.js)에서 일반화 추출.
 *       페이지 훅(DOM ID·z순서 교차·전역 커서 연동·'hero:start-berries' 이벤트)은 제거하고
 *       container 인자 + setProgress + start() + 옵션으로 대체. window.QNB.device → lowPower 옵션.
 */
import * as THREE from "three";

const DEFAULTS = {
  count: 24,
  rMin: 1.9, rMax: 2.5, // 알갱이 크기(중앙=크게·가장자리=작게)
  cloudX: 10.5, cloudY: 5.1, cloudZ: 2.4, cloudCenterY: 0.45, // 구름 퍼짐
  spring: 0.001, jitter: 0.18, returnGain: 0.6,
  idleAmp: 0.48, idleFreq: 0.32, // 부유
  burstFrom: 0.5, burst: 0.1, appearDur: 0.45, appearStagger: 0.074, // 등장 버스트
  spinInit: 0.07, idleSpin: 0.0025, spinReturn: 0.05,
  mouseSpin: 0.025, mouseSpinSweep: 0.05,
  friction: 0.9, sleepV: 0, restitution: 0.1, collideSlop: 0.1, collideSoft: 0.4,
  mouseRadiusNdc: 0.24, mousePush: 0.85, mouseSweep: 1.4, mouseSweepClamp: 0.12,
  camStart: 30, camDist: 22, camEase: 1.8, fov: 38,
  // 스크롤 통과(setProgress 0~1). progress를 안 주면 카메라는 dolly-in만.
  approachStart: 0.3, approachZ: 6, approachEnd: 0.64, camPass: -7, passEnd: 0.86,
  modelUrl: null, // GLTF URL (null이면 구체 폴백)
  // 색 그레이딩(모델 텍스처를 brand 쪽으로 끌고 어두운 골을 들어올림)
  brand: "#4545da", tint: 0.2, shadowLift: 0.25, exposure: 1.22,
  ambient: 0.38, ambientColor: 0x4d4fc4, sphereColor: 0x4545da,
  lowPower: null, // null=자동(window.QNB.device) / true·false 강제
  autoStart: true, // true면 생성 즉시 등장 / false면 start()로 트리거
  pauseWhenHidden: true,
};

const GOLD = Math.PI * (3 - Math.sqrt(5));

export class ObjectCluster3D {
  /**
   * @param {HTMLElement|string} container
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(container, options = {}) {
    this.el = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.el) throw new Error("[object-cluster-3d] container not found");
    this.C = Object.assign({}, DEFAULTS, options);
    this._progress = 0;
    this._running = false; this._raf = 0; this._visible = true;
    this._started = false; this._ready = false; this._triggered = false;
    this.berries = [];
    this._frameN = 0; this._tStart = null;
    this.onHover = null; // (isHover:boolean) => void
    this._init();
  }

  _init() {
    const C = this.C;
    if (getComputedStyle(this.el).position === "static") this.el.style.position = "relative";
    this._lowp = C.lowPower != null ? !!C.lowPower
      : !!(window.QNB && window.QNB.device && window.QNB.device.isLowPower);
    if (this._lowp) {
      C.rMin = Math.min(C.rMin, 1.5); C.rMax = Math.min(C.rMax, 2.0);
      C.cloudX = Math.min(C.cloudX, 7.2);
      C.mouseRadiusNdc = Math.max(C.mouseRadiusNdc, 0.34);
    }

    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" });
    this.el.appendChild(this.canvas);

    this.W = this.el.clientWidth || window.innerWidth;
    this.H = this.el.clientHeight || window.innerHeight;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this._lowp, alpha: true });
    r.setClearColor(0x000000, 0);
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this._lowp ? 1.25 : 2));
    r.shadowMap.enabled = !this._lowp; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = C.exposure;
    r.setSize(this.W, this.H);

    const scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(C.fov, this.W / this.H, 0.1, 100);
    this.camera.position.set(0, 0, C.camStart); this.camera.lookAt(0, 0, 0);

    // 스카이돔(인디고 그라데이션) — 큐브 카메라가 담아 IBL/반사로 사용
    const skyTex = this._makeSkyTex();
    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide }));
    this.skyDome.visible = false; scene.add(this.skyDome);
    this.cubeRT = new THREE.WebGLCubeRenderTarget(256, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    this.cubeCam = new THREE.CubeCamera(1, 200, this.cubeRT); scene.add(this.cubeCam);
    scene.environment = this.cubeRT.texture;

    const keyL = new THREE.DirectionalLight(0xccd0f4, 0.85); keyL.position.set(7, 11, 6); keyL.castShadow = !this._lowp;
    keyL.shadow.mapSize.set(1024, 1024); keyL.shadow.radius = 4;
    const sc = keyL.shadow.camera; sc.near = 1; sc.far = 70; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.updateProjectionMatrix();
    keyL.shadow.bias = -0.0006; keyL.shadow.normalBias = 0.06;
    scene.add(keyL);
    scene.add(new THREE.AmbientLight(C.ambientColor, C.ambient));

    this.BG = null; this.BM = null; this._hasRoughMap = false;
    this._cur = new THREE.Vector2(-10, -10); this._pcur = new THREE.Vector2(-10, -10); this._mIn = false;
    this._onMove = (e) => { this._cur.set((e.clientX / this.W) * 2 - 1, -((e.clientY / this.H) * 2 - 1)); this._mIn = true; };
    this._onLeave = () => { this._mIn = false; };
    window.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerleave", this._onLeave);
    this._onResize = () => this.resize();
    window.addEventListener("resize", this._onResize);

    if (C.pauseWhenHidden && "IntersectionObserver" in window) {
      this._io = new IntersectionObserver(([en]) => { this._visible = en.isIntersecting; }, { threshold: 0 });
      this._io.observe(this.el);
    }

    this.canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
    this.canvas.addEventListener("webglcontextrestored", () => { this._frameN = 0; if (!this._lowp) this.renderer.shadowMap.needsUpdate = true; });

    // 스크래치 벡터
    this._cr = new THREE.Vector3(); this._cu = new THREE.Vector3(); this._cf = new THREE.Vector3();
    this._tmp = new THREE.Vector3(); this._ih = new THREE.Vector3(); this._proj = new THREE.Vector3();
    this._pd = new THREE.Vector3(); this._sd = new THREE.Vector3(); this._nrm = new THREE.Vector3();

    this._loadGeometry().then(() => { this._ready = true; this._maybeStart(); });
    this._last = performance.now();
    this._loop = (now) => {
      this._raf = requestAnimationFrame(this._loop);
      this._last = now;
      if (!this._visible || !this.BG || !this._started || !this._running) return;
      this._clusterStep(now);
    };
    if (this.C.autoStart) this._triggered = true;
    this.start();
  }

  _makeSkyTex() {
    const cv = document.createElement("canvas"); cv.width = 16; cv.height = 256;
    const x = cv.getContext("2d"); const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, "#ccd2f0"); g.addColorStop(0.32, "#9298d8");
    g.addColorStop(0.62, "#5a5ec2"); g.addColorStop(1.0, "#262a54");
    x.fillStyle = g; x.fillRect(0, 0, 16, 256);
    const t = new THREE.CanvasTexture(cv); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  async _loadGeometry() {
    const C = this.C;
    const mkPhysical = (extra) => {
      const m = new THREE.MeshPhysicalMaterial(Object.assign({ clearcoat: 0.14, clearcoatRoughness: 0.35, envMapIntensity: 0.65 }, extra));
      m.emissive = new THREE.Color(0x000000); m.emissiveIntensity = 0;
      this._applyGrading(m);
      return m;
    };
    if (C.modelUrl) {
      try {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const gltf = await new Promise((res, rej) => new GLTFLoader().load(C.modelUrl, res, undefined, rej));
        let src = null; gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
        if (src) {
          const g = src.geometry.clone(); g.computeBoundingSphere(); const sp = g.boundingSphere;
          g.translate(-sp.center.x, -sp.center.y, -sp.center.z); const s = 1 / sp.radius; g.scale(s, s, s); this.BG = g;
          const sm = src.material; this._hasRoughMap = !!sm.roughnessMap;
          this.BM = mkPhysical({
            map: sm.map || null, normalMap: sm.normalMap || null,
            normalScale: sm.normalScale ? sm.normalScale.clone() : new THREE.Vector2(0.7, 0.7),
            roughnessMap: sm.roughnessMap || null, metalnessMap: sm.metalnessMap || null,
            roughness: sm.roughnessMap ? 1.0 : 0.45, metalness: sm.metalnessMap ? 1.0 : 0.0,
            color: new THREE.Color(0xffffff),
          });
          return;
        }
      } catch (e) { /* 폴백으로 */ }
    }
    // 폴백/기본: 구체
    this.BG = new THREE.SphereGeometry(1, 32, 24);
    this.BM = mkPhysical({ color: new THREE.Color(C.sphereColor), roughness: 0.5, metalness: 0.0 });
    this._hasRoughMap = false;
  }

  _applyGrading(BM) {
    const C = this.C;
    const _bc = new THREE.Color(C.brand);
    const brandGlsl = `vec3(${_bc.r.toFixed(4)}, ${_bc.g.toFixed(4)}, ${_bc.b.toFixed(4)})`;
    BM.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
        {
          vec3 _brand = ${brandGlsl};
          float _lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          diffuseColor.rgb += _brand * ${C.shadowLift.toFixed(3)} * (1.0 - clamp(_lum * 4.0, 0.0, 1.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, _brand, ${C.tint.toFixed(3)});
        }`);
    };
  }

  _popScale(t) {
    if (t <= 0) return 0; if (t >= 1) return 1;
    if (t < 0.82) { const u = t / 0.82; return 1.07 * u * u * u; }
    const u = (t - 0.82) / 0.18; return 1.07 + (1 - 1.07) * (u * u * (3 - 2 * u));
  }

  _spawn() {
    const C = this.C;
    for (let i = 0; i < C.count; i++) {
      const t = (i + 0.5) / C.count, rad = Math.sqrt(t), ang = i * GOLD;
      const span = C.rMax - C.rMin;
      let rr = C.rMax - span * rad + (Math.random() - 0.5) * span * 0.4;
      rr = Math.max(C.rMin * 0.85, Math.min(C.rMax * 1.05, rr));
      const mesh = new THREE.Mesh(this.BG, this.BM);
      mesh.scale.setScalar(0.0001); mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      mesh.material = this.BM.clone();
      mesh.material.roughness = (this._hasRoughMap ? 0.7 : 0.3) + Math.random() * 0.45;
      const home = new THREE.Vector3(
        Math.cos(ang) * rad * C.cloudX + (Math.random() - 0.5) * C.cloudX * C.jitter,
        C.cloudCenterY + Math.sin(ang) * rad * C.cloudY + (Math.random() - 0.5) * C.cloudY * C.jitter,
        (Math.random() - 0.5) * 2 * C.cloudZ);
      const pos = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(C.burstFrom);
      pos.y += C.cloudCenterY;
      const vel = home.clone().sub(pos).multiplyScalar(C.burst);
      mesh.position.copy(pos); this.scene.add(mesh);
      const bs = new THREE.Vector3((Math.random() - 0.5) * 2 * C.idleSpin, (Math.random() - 0.5) * 2 * C.idleSpin, (Math.random() - 0.5) * 2 * C.idleSpin);
      this.berries.push({
        mesh, pos, vel, r: rr, home, appear: 0, delay: i * C.appearStagger,
        ph: new THREE.Vector3(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28),
        baseSpin: bs,
        spin: new THREE.Vector3(bs.x + (Math.random() - 0.5) * 2 * C.spinInit, bs.y + (Math.random() - 0.5) * 2 * C.spinInit, bs.z + (Math.random() - 0.5) * 2 * C.spinInit),
      });
    }
  }

  _maybeStart() { if (this._ready && this._triggered && !this._started) { this._started = true; this._spawn(); } }

  _clusterStep(now) {
    const C = this.C;
    if (this._tStart === null) this._tStart = now;
    const elapsed = (now - this._tStart) / 1000;
    const k = Math.min(elapsed / C.camEase, 1), ease = 1 - Math.pow(1 - k, 5);
    const dollyZ = C.camStart + (C.camDist - C.camStart) * ease;
    const hp = this._progress;
    let camZ;
    if (hp <= C.approachStart) camZ = dollyZ;
    else if (hp <= C.approachEnd) {
      const s = (hp - C.approachStart) / Math.max(1e-4, C.approachEnd - C.approachStart);
      const e = s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2;
      camZ = dollyZ + (C.approachZ - dollyZ) * e;
    } else {
      const s = Math.min(1, (hp - C.approachEnd) / Math.max(1e-4, C.passEnd - C.approachEnd));
      camZ = C.approachZ + (C.camPass - C.approachZ) * s;
    }
    this.camera.position.z = camZ;
    const yProg = Math.max(0, Math.min(1, (hp - C.approachStart) / Math.max(1e-4, C.passEnd - C.approachStart)));
    this.camera.position.y = C.cloudCenterY * yProg;
    this.camera.updateMatrixWorld(); this.camera.matrixWorld.extractBasis(this._cr, this._cu, this._cf);

    const cl = C.mouseSweepClamp;
    const mvx = this._mIn ? Math.max(-cl, Math.min(cl, this._cur.x - this._pcur.x)) : 0;
    const mvy = this._mIn ? Math.max(-cl, Math.min(cl, this._cur.y - this._pcur.y)) : 0;
    let hover = false;
    for (const b of this.berries) {
      if (b.appear < 1) { b.appear = Math.min((elapsed - b.delay) / C.appearDur, 1); if (b.appear < 0) b.appear = 0; }
      b.mesh.scale.setScalar(Math.max(0.0001, b.r * this._popScale(b.appear)));
      if (b.appear <= 0) { b.mesh.position.copy(b.pos); continue; }
      this._ih.set(b.home.x + Math.sin(elapsed * C.idleFreq + b.ph.x) * C.idleAmp,
        b.home.y + Math.sin(elapsed * C.idleFreq * 0.8 + b.ph.y) * C.idleAmp,
        b.home.z + Math.sin(elapsed * C.idleFreq * 1.15 + b.ph.z) * C.idleAmp);
      this._tmp.copy(this._ih).sub(b.pos);
      const kEff = C.spring * (1 + C.returnGain * this._tmp.length());
      b.vel.addScaledVector(this._tmp, kEff);
      if (this._mIn && b.appear > 0.5) {
        this._proj.copy(b.pos).project(this.camera);
        const dx = this._proj.x - this._cur.x, dy = this._proj.y - this._cur.y, dist = Math.hypot(dx, dy);
        if (dist < C.mouseRadiusNdc && this._proj.z < 1) {
          hover = true; const f = 1 - dist / C.mouseRadiusNdc;
          this._pd.set(0, 0, 0).addScaledVector(this._cr, dx).addScaledVector(this._cu, dy);
          if (this._pd.lengthSq() < 1e-6) this._pd.copy(this._cr); this._pd.normalize();
          b.vel.addScaledVector(this._pd, C.mousePush * f);
          this._sd.set(0, 0, 0).addScaledVector(this._cr, mvx).addScaledVector(this._cu, mvy);
          b.vel.addScaledVector(this._sd, C.mouseSweep * f);
          b.spin.x += -mvy * C.mouseSpinSweep + (Math.random() - 0.5) * C.mouseSpin * f;
          b.spin.y += mvx * C.mouseSpinSweep + (Math.random() - 0.5) * C.mouseSpin * f;
          b.spin.z += (Math.random() - 0.5) * C.mouseSpin * f;
        }
      }
    }
    if (typeof this.onHover === "function") this.onHover(this._mIn && hover);

    for (let i = 0; i < this.berries.length; i++)
      for (let j = i + 1; j < this.berries.length; j++) {
        const a = this.berries[i], c = this.berries[j]; if (a.appear < 0.3 || c.appear < 0.3) continue;
        this._nrm.copy(c.pos).sub(a.pos); let dist = this._nrm.length(); if (dist === 0) { dist = 0.001; this._nrm.set(1, 0, 0); }
        const pen = a.r + c.r - C.collideSlop - dist;
        if (pen > 0) {
          this._nrm.multiplyScalar(1 / dist); const ov = pen * C.collideSoft;
          a.pos.addScaledVector(this._nrm, -ov); c.pos.addScaledVector(this._nrm, ov);
          const va = a.vel.dot(this._nrm), vc = c.vel.dot(this._nrm), ma = a.r ** 3, mc = c.r ** 3, vR = va - vc;
          if (vR > 0) { const imp = (1 + C.restitution) * vR / (ma + mc); a.vel.addScaledVector(this._nrm, -imp * mc); c.vel.addScaledVector(this._nrm, imp * ma); }
        }
      }
    for (const b of this.berries) {
      if (b.appear <= 0) continue;
      b.vel.multiplyScalar(C.friction);
      if (b.vel.lengthSq() < C.sleepV * C.sleepV) b.vel.set(0, 0, 0);
      b.pos.add(b.vel); b.mesh.position.copy(b.pos);
      b.spin.x += (b.baseSpin.x - b.spin.x) * C.spinReturn;
      b.spin.y += (b.baseSpin.y - b.spin.y) * C.spinReturn;
      b.spin.z += (b.baseSpin.z - b.spin.z) * C.spinReturn;
      b.mesh.rotation.x += b.spin.x; b.mesh.rotation.y += b.spin.y; b.mesh.rotation.z += b.spin.z;
    }
    this._pcur.copy(this._cur);

    const CUBE_EVERY = this._lowp ? 30 : 1;
    const doCube = this._lowp ? this._frameN === 0 : this._frameN % CUBE_EVERY === 0;
    if (doCube) { this.skyDome.visible = true; this.cubeCam.position.set(0, C.cloudCenterY, 0); this.cubeCam.update(this.renderer, this.scene); this.skyDome.visible = false; }
    if (!this._lowp) this.renderer.shadowMap.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
    this._frameN++;
  }

  /** 스크롤 진행(0~1) — 카메라가 클러스터에 접근→통과 */
  setProgress(p) { this._progress = p < 0 ? 0 : p > 1 ? 1 : p; return this; }

  /** 등장 트리거(autoStart=false일 때). 이미 시작했으면 무시. */
  start() {
    this._triggered = true; this._maybeStart();
    if (!this._running) { this._running = true; this._raf = requestAnimationFrame(this._loop); }
    return this;
  }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = 0; this.renderer?.clear(); return this; }
  resize() {
    this.W = this.el.clientWidth || window.innerWidth; this.H = this.el.clientHeight || window.innerHeight;
    this.renderer.setSize(this.W, this.H); this.camera.aspect = this.W / this.H; this.camera.updateProjectionMatrix();
    return this;
  }
  setOptions(p = {}) { Object.assign(this.C, p); return this; }
  destroy() {
    this.stop();
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerleave", this._onLeave);
    window.removeEventListener("resize", this._onResize);
    this._io?.disconnect();
    for (const b of this.berries) b.mesh.material?.dispose?.();
    this.BM?.dispose?.(); this.BG?.dispose?.();
    this.cubeRT?.dispose?.();
    this.renderer?.dispose();
    this.canvas?.parentNode?.removeChild(this.canvas);
  }
}
export default ObjectCluster3D;
