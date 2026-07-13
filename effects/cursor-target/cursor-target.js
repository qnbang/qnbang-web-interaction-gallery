/**
 * Cursor Target — 닿으면 (커서가) 버튼 모양대로 채우고, 링 수축 + 라벨 자석 + 커서 위로 올림
 *
 * makepill.com 의 CursorTarget 동작을 의존성 없이 재구현. 채움(fill)은 이 효과가 아니라 짝 효과
 * smooth-cursor 가 그린다 — 커서의 점이 닿은 자리에서 이 버튼의 모양·크기로 퍼져 채우고, 채운 채
 * 포인터를 따라 morph 한다(흡수가 아니라 변형). 그래서 이 효과는:
 *   - hover 시 버튼을 z-index(raiseZ)로 커서 위에 올려, 배경 투명한 버튼 너머로 커서 채움이 보이되
 *     텍스트는 그 위에 오게 한다.
 *   - 둘레 링(::after)을 scale3d(0,0,1)로 수축시키고 글자색을 primary 로 바꾼다.
 *   - 안쪽 라벨을 커서를 향해 자석처럼 끌어당긴다((커서−중심)×strength, lerp).
 *   - 채움색을 --ct-fill CSS 변수로 노출 → smooth-cursor 가 읽어 그 색으로 채운다.
 *
 * 원본 minified 번들 복사가 아니라 추출한 동작·상수를 독립 구현한 것이다.
 */

const STYLE_ID = 'cursor-target-style';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const DEFAULTS = {
  targets: 'a, button, [data-cursor-target]',
  fill: '#ffffff',                 // 채움색(커서가 이 색으로 채운다)
  primary: '#0f0f0f',              // hover 시 글자색(채움 위에서 잘 보이게)
  ring: 'rgba(255,255,255,0.3)',   // 평소 hollow 링 색
  ringWidth: '1px',
  strength: 0.75,                  // 라벨 자석 당김 비율 — 원본 0.75
  disabledStrength: 0.35,          // 원본 0.35
  lerpSpeed: 5,                    // 라벨 자석 lerp 속도(×dt) — 원본 5
  raiseZ: 9001,                    // hover 시 z-index (= 커서 zIndex보다 커야 텍스트가 채움 위)
  cursor: null,                    // SmoothCursor 인스턴스(자석을 커서 보간 위치에 동기화)
  magnetic: true,
};

let _styleRefs = 0;   // 인스턴스 수 카운트 — 마지막 destroy 때만 공유 <style> 제거(중복 주입 방지)

/** 공유 <style> 1회 주입(링 ::after, ct-on 전환). 이미 있으면 ref만 +1 */
function ensureStyle(opt) {
  if (document.getElementById(STYLE_ID)) { _styleRefs++; return; }
  const css = `
.cursor-target { position: relative; transition: color .15s linear; }
.cursor-target > .ct-magnetic { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; will-change: transform; }
.cursor-target::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  border: ${opt.ringWidth} solid var(--ct-ring, ${opt.ring}); pointer-events: none; z-index: 0;
  transition: border-color .5s cubic-bezier(0.25,0.46,0.45,0.94), transform .9s cubic-bezier(0.19,1,0.22,1);
}
.cursor-target.ct-on { color: var(--ct-primary, ${opt.primary}); }
.cursor-target.ct-on::after { border-color: transparent; transform: scale3d(0,0,1); }`;
  const el = document.createElement('style');
  el.id = STYLE_ID; el.textContent = css;
  document.head.appendChild(el);
  _styleRefs++;
}

export class CursorTarget {
  /**
   * @param {HTMLElement|string|Document} [container=document]
   * @param {Partial<typeof DEFAULTS>} [options]
   */
  constructor(container = document, options = {}) {
    // 편의: 첫 인자로 옵션 객체만 넘기면 container 생략(document 전체)으로 간주
    if (container && typeof container === 'object' && !('nodeType' in container) && Object.keys(options).length === 0) {
      options = container; container = document;
    }
    this.root = typeof container === 'string' ? document.querySelector(container) : (container || document);
    if (!this.root) throw new Error('[cursor-target] container not found');
    this.opt = Object.assign({}, DEFAULTS, options);
    this.items = [];
    this._fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    this.pointer = { x: -9999, y: -9999 };   // 초기엔 화면 밖(아직 자석 당김 없음)
    this._running = false; this._raf = null; this._last = 0;
    ensureStyle(this.opt);
    this.refresh();   // 컨테이너 안 targets 를 모두 cursor-target 으로 등록

    // 자석 효과는 마우스 환경에서만. cursor 인스턴스가 있으면 그 보간 위치에 동기화(아래 _cursorPos).
    if (this._fine && this.opt.magnetic) {
      this._onMove = (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; };
      window.addEventListener('mousemove', this._onMove, { passive: true });
      this.start();
    }
  }

  refresh() {
    const scope = this.root.querySelectorAll ? this.root : document;
    scope.querySelectorAll(this.opt.targets).forEach((el) => this.add(el));
    return this;
  }

  add(el) {
    if (!el || el.classList.contains('cursor-target')) return this;
    el.classList.add('cursor-target');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.setProperty('--ct-fill', this.opt.fill);       // smooth-cursor 가 읽어 채움색으로 사용
    el.style.setProperty('--ct-primary', this.opt.primary);
    el.style.setProperty('--ct-ring', this.opt.ring);

    // 내용(라벨)을 래퍼로 감싸 자석 이동
    const inner = document.createElement('span');
    inner.className = 'ct-magnetic';
    while (el.firstChild) inner.appendChild(el.firstChild);
    el.appendChild(inner);

    const item = { el, inner, hovered: false, cur: { x: 0, y: 0 },
      disabled: el.hasAttribute('disabled') || el.classList.contains('disabled') };
    item._onEnter = () => { el.classList.add('ct-on'); el.style.zIndex = String(this.opt.raiseZ); item.hovered = true; };
    item._onLeave = () => { el.classList.remove('ct-on'); item.hovered = false; };
    el.addEventListener('mouseenter', item._onEnter);
    el.addEventListener('mouseleave', item._onLeave);
    this.items.push(item);
    return this;
  }

  /** 자석 계산용 현재 커서 위치(페어 SmoothCursor 보간 위치 우선, 없으면 원시 포인터) */
  _cursorPos() {
    const c = this.opt.cursor;
    return (c && c.currentCursorPosition) ? c.currentCursorPosition : this.pointer;
  }

  _frame = (now) => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._frame);
    let dt = this._last ? (now - this._last) / 1000 : 0.016;
    this._last = now;
    const a = clamp(this.opt.lerpSpeed * Math.min(dt, 0.05), 0, 1);
    const cp = this._cursorPos();

    for (const it of this.items) {
      // 목표 오프셋: hover 중이면 (커서−버튼중심)×strength, 아니면 0(제자리 복귀)
      let tx = 0, ty = 0;
      if (it.hovered) {
        const r = it.el.getBoundingClientRect();
        const s = it.disabled ? this.opt.disabledStrength : this.opt.strength;
        tx = (cp.x - (r.x + r.width * 0.5)) * s;
        ty = (cp.y - (r.y + r.height * 0.5)) * s;
      }
      // 현재 오프셋을 목표로 lerp(쫀득하게 따라옴). 거의 0이고 hover 도 아니면 갱신 생략(불필요한 transform 회피).
      it.cur.x += (tx - it.cur.x) * a;
      it.cur.y += (ty - it.cur.y) * a;
      if (it.hovered || Math.abs(it.cur.x) > 0.01 || Math.abs(it.cur.y) > 0.01) {
        it.inner.style.transform = `translate3d(${it.cur.x}px, ${it.cur.y}px, 0)`;
      }
    }
  };

  start() { if (this._running) return this; this._running = true; this._last = 0; this._raf = requestAnimationFrame(this._frame); return this; }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; return this; }

  /** rAF·리스너 해제 + 추가했던 클래스/변수/래퍼를 원상복구(라벨을 ct-magnetic 밖으로 되돌림) */
  destroy() {
    this.stop();
    if (this._onMove) window.removeEventListener('mousemove', this._onMove);
    this.items.forEach((it) => {
      it.el.removeEventListener('mouseenter', it._onEnter);
      it.el.removeEventListener('mouseleave', it._onLeave);
      it.el.classList.remove('cursor-target', 'ct-on');
      it.el.style.removeProperty('z-index');
      ['--ct-fill', '--ct-primary', '--ct-ring'].forEach((v) => it.el.style.removeProperty(v));
      while (it.inner.firstChild) it.el.insertBefore(it.inner.firstChild, it.inner);
      it.inner.remove();
    });
    this.items = [];
    if (--_styleRefs <= 0) { document.getElementById(STYLE_ID)?.remove(); _styleRefs = 0; }
  }
}

export default CursorTarget;
