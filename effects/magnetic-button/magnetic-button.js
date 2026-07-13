/**
 * MagneticButton — 커서를 따라오는 자석 버튼 (+ elastic reveal · 클릭 squish)
 *
 * 동작:
 *  - reveal(true): 작게 웅크린 상태(scale 0.6, 투명)에서 elastic 으로 통통 등장.
 *  - 떠 있는 동안 커서를 magnet 비율만큼 따라옴(quickTo, 부드러운 추종).
 *  - mousedown 시 살짝 눌리고(squish) mouseup 시 elastic 복귀.
 *  - reveal(false): 줄며 페이드 아웃, 포인터 비활성.
 *
 * 출처: 큐앤뱅 리믹스6 푸터 CTA(footer-cta-button.js)에서 일반화 추출.
 *
 * 의존: gsap (bare import — 데모/소비측 importmap 으로 매핑).
 */
import gsap from "gsap";

const DEFAULTS = {
  magnet: 0.28, // 커서 추종 강도(0~1, 클수록 멀리 따라옴)
  hiddenScale: 0.6, // 숨김 상태 scale
  showDuration: 0.7, // 등장 트윈 길이(s)
  showEase: "elastic.out(1, 0.5)", // 등장 이징(쫀득)
  pressScale: 0.92, // mousedown squish scale
  startHidden: true, // 마운트 시 숨김으로 시작(이후 reveal 로 등장)
  followDuration: 0.5, // 커서 추종 트윈 길이(s)
  followEase: "power3",
};

export class MagneticButton {
  /**
   * @param {HTMLElement|string} el  버튼 요소(또는 선택자)
   * @param {Partial<typeof DEFAULTS>} options
   */
  constructor(el, options = {}) {
    this.el = typeof el === "string" ? document.querySelector(el) : el;
    if (!this.el) throw new Error("MagneticButton: 요소를 찾을 수 없습니다.");
    this.opt = Object.assign({}, DEFAULTS, options);
    this._visible = !this.opt.startHidden;

    this._xTo = gsap.quickTo(this.el, "x", { duration: this.opt.followDuration, ease: this.opt.followEase });
    this._yTo = gsap.quickTo(this.el, "y", { duration: this.opt.followDuration, ease: this.opt.followEase });

    if (this.opt.startHidden) {
      gsap.set(this.el, { autoAlpha: 0, scale: this.opt.hiddenScale });
      this.el.style.pointerEvents = "none";
    }

    // 핸들러 보관(destroy 시 해제)
    this._onMove = (e) => {
      if (!this._visible) return;
      const r = this.el.getBoundingClientRect();
      this._xTo((e.clientX - (r.left + r.width / 2)) * this.opt.magnet);
      this._yTo((e.clientY - (r.top + r.height / 2)) * this.opt.magnet);
    };
    this._onLeave = () => { this._xTo(0); this._yTo(0); };
    this._onDown = () => gsap.to(this.el, { scale: this.opt.pressScale, duration: 0.12 });
    this._onUp = () => gsap.to(this.el, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" });

    this.el.addEventListener("mousemove", this._onMove);
    this.el.addEventListener("mouseleave", this._onLeave);
    this.el.addEventListener("mousedown", this._onDown);
    this.el.addEventListener("mouseup", this._onUp);
  }

  /** 버튼 등장/퇴장 토글 */
  reveal(on = true) {
    this._visible = on;
    gsap.to(this.el, { autoAlpha: on ? 1 : 0, duration: on ? 0.4 : 0.3, ease: "power2.out" });
    gsap.to(this.el, {
      scale: on ? 1 : this.opt.hiddenScale,
      duration: on ? this.opt.showDuration : 0.3,
      ease: on ? this.opt.showEase : "power2.in",
    });
    this.el.style.pointerEvents = on ? "auto" : "none";
    return this;
  }

  hide() { return this.reveal(false); }

  /** 옵션 런타임 변경 */
  setOptions(partial = {}) { Object.assign(this.opt, partial); return this; }

  /** 이벤트·트윈 해제 */
  destroy() {
    this.el.removeEventListener("mousemove", this._onMove);
    this.el.removeEventListener("mouseleave", this._onLeave);
    this.el.removeEventListener("mousedown", this._onDown);
    this.el.removeEventListener("mouseup", this._onUp);
    gsap.killTweensOf(this.el);
  }
}

export default MagneticButton;
