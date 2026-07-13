/**
 * HoverList — 리스트 항목 hover 인터랙션 (행 와이프 채움 + 텍스트 들여쓰기 + 화살표 디블러 슬라이드인 + blip 사운드)
 *
 * 각 항목 텍스트를 [heading + arrow] 2단 구조로 감싸고, hover 시:
 *  - 행 배경이 왼→오 와이프로 채워지고(::before scaleX)
 *  - heading 이 우측으로 살짝 이동
 *  - 화살표(→)가 좌측에서 blur(4px)→0 으로 디블러되며 슬라이드-인
 *  - 짧고 부드러운 '톡' 사운드(Web Audio 합성 — 오디오 파일 불필요)
 *
 * 시각 규칙은 hover-list.css 가 담당(이 JS 는 DOM 구조 주입 + 사운드만).
 * 출처: 큐앤뱅 리믹스6 Our Service(service-hover.js)에서 일반화 추출.
 */

const DEFAULTS = {
  itemSelector: ".hl-item", // 항목 선택자(이 안의 텍스트를 heading 으로 감쌈)
  arrow: "→", // 화살표 글리프
  sound: true, // hover blip 사운드
  soundVolume: 0.05, // 0~1
  desktopOnly: true, // (hover:hover) and (pointer:fine) 에서만 활성
};

export class HoverList {
  /**
   * @param {HTMLElement|string} root  항목들을 담은 컨테이너(또는 선택자)
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(root, options = {}) {
    this.root = typeof root === "string" ? document.querySelector(root) : root;
    if (!this.root) throw new Error("HoverList: 컨테이너를 찾을 수 없습니다.");
    this.opt = Object.assign({}, DEFAULTS, options);

    if (this.opt.desktopOnly && window.matchMedia &&
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      this.items = [];
      return; // 터치/모바일에선 구조 주입·사운드 생략(CSS hover 만)
    }

    this.items = [...this.root.querySelectorAll(this.opt.itemSelector)];
    this._ctx = null;
    this._lastT = 0;

    // 1) 각 항목을 [heading + arrow] 2단 구조로 (텍스트만 span 으로 감싼다 — 속성·핸들러 보존)
    for (const el of this.items) {
      if (el.querySelector(".hl-heading")) continue;
      const text = (el.textContent || "").trim();
      el.textContent = "";
      const heading = document.createElement("span");
      heading.className = "hl-heading";
      heading.textContent = text;
      const arrow = document.createElement("span");
      arrow.className = "hl-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = this.opt.arrow;
      el.append(heading, arrow);
    }

    // 2) 사운드 컨텍스트(자동재생 정책상 첫 제스처 후 활성)
    this._onGesture = () => this._ensureCtx();
    if (this.opt.sound) {
      ["pointerdown", "keydown", "wheel"].forEach((ev) =>
        window.addEventListener(ev, this._onGesture, { passive: true }),
      );
    }

    // 3) hover blip
    this._onEnter = () => { if (this.opt.sound) this._blip(); };
    for (const el of this.items) el.addEventListener("mouseenter", this._onEnter);
  }

  _ensureCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this._ctx) this._ctx = new AC();
    if (this._ctx.state === "suspended") this._ctx.resume();
    return this._ctx;
  }

  /** 짧고 부드러운 '톡' — triangle osc 1180→720Hz, 110ms */
  _blip() {
    const c = this._ensureCtx();
    if (!c) return;
    const now = c.currentTime;
    if (now - this._lastT < 0.04) return; // 빠른 연속 hover 디바운스
    this._lastT = now;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.07);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(this.opt.soundVolume, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    osc.connect(g).connect(c.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  destroy() {
    for (const el of this.items || []) el.removeEventListener("mouseenter", this._onEnter);
    if (this._onGesture) {
      ["pointerdown", "keydown", "wheel"].forEach((ev) =>
        window.removeEventListener(ev, this._onGesture),
      );
    }
    if (this._ctx) { try { this._ctx.close(); } catch {} this._ctx = null; }
  }
}

export default HoverList;
