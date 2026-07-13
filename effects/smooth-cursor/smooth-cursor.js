/**
 * Smooth Cursor — 점이 마우스를 따라오며 늘어나고, 버튼에 닿으면 그 자리에서 버튼 모양대로 퍼져 채우는 커서
 *
 * makepill.com 의 Cursor.js(onTick·magnetize)를 의존성 없이 재구현. 핵심:
 *   pos      = lerp(pos, target, 10*dt)                 // 점이 살짝 딜레이로 추종
 *   velocity = target - pos
 *   morphX   = min(1 + |v|*morphLevel, 1.3)             // 속도로 늘어남(stretch)
 *   morphY   = max(1 - |v|*morphLevel*0.25, 0.5)
 *   scale    = lerp(scale, targetScale, 7*dt)
 *   angle    = atan2(v.y, v.x)                           // 진행 방향으로 회전
 *
 * 버튼(cursor-target) 진입 시: 점은 0으로 줄고(흡수 아님) 동시에 "채움(fillEl)"이 0→1로 자라
 * 그 자리에서 퍼진다 = 점이 채움으로 변형. 채움은 버튼 크기·border-radius 로 그려지므로
 * (원본은 원을 scale해 비정원=타원·확대 블러가 났던 문제를) 어떤 모양이든 정확하고 선명하게 채운다.
 * 채운 뒤에도 채움은 포인터를 따라 lerp·morph 하며 쫀득하게 움직인다. 벗어나면 다시 점으로 돌아온다.
 *
 * 원본 minified 번들을 복사한 것이 아니라 추출한 알고리즘·상수를 독립 구현한 것이다.
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** 2D 벡터 — 위치/속도/morph 보관용 미니 헬퍼 (외부 의존성 없이 lerp까지) */
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  set(x, y) { this.x = x; this.y = y; return this; }
  copy(v) { this.x = v.x; this.y = v.y; return this; }
  /** this 를 t 방향으로 비율 a 만큼 보간 (a=1이면 즉시 도달). 프레임마다 호출 */
  lerp(t, a) { this.x += (t.x - this.x) * a; this.y += (t.y - this.y) * a; return this; }
  distTo(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
}

const DEFAULTS = {
  size: 14,                 // 점 지름(px) — 원본과 동일
  color: '#ffffff',         // 점·채움 기본색
  textColor: '#0f0f0f',     // 라벨 글자색
  mainSpeed: 10,            // 위치 lerp 속도(×dt) — 원본 10
  scaleSpeed: 7,            // 점↔채움 전환 lerp 속도 — 원본 7
  morphLevel: 0.008,        // 속도→늘어남 강도(평소) — 원본 0.008
  morphLevelHover: 0.002,   // 비정원 채움/라벨 중 강도(축정렬 살짝) — 원본 0.002
  morphMax: 1.3,            // 늘어남 상한 — 원본 1.3
  // 닿으면 점이 이 요소 모양·크기로 퍼져 채운다
  fillSelector: '.cursor-target, [data-cursor-fill]',
  fillVar: '--ct-fill',     // 타깃에서 읽을 채움색 CSS 변수(없으면 color)
  // 라벨 타깃(텍스트 링크): hover 시 점이 커지고 라벨 표시
  labelSelector: '[data-cursor-text], [data-cursor-icon]',
  labelAttr: 'data-cursor-text',
  iconAttr: 'data-cursor-icon',
  hoverScale: 3,
  themeAttr: 'data-cursor-theme',
  themes: {
    white: { dot: '#ffffff', text: '#0f0f0f' },
    dark:  { dot: '#0f0f0f', text: '#ffffff' },
    green: { dot: '#deff00', text: '#0f0f0f' },
  },
  blendDifference: false,
  hideNative: true,
  zIndex: 9000,
  respectReducedMotion: true,
  autoStart: true,
};

export class SmoothCursor {
  /**
   * @param {HTMLElement|string} [container=document.body]
   * @param {Partial<typeof DEFAULTS>} [options]
   */
  constructor(container = document.body, options = {}) {
    // 편의: 첫 인자로 옵션 객체만 넘기면(= DOM 노드가 아니면) container 생략으로 간주
    if (container && typeof container === 'object' && !('nodeType' in container) && Object.keys(options).length === 0) {
      options = container; container = document.body;
    }
    this.el = typeof container === 'string' ? document.querySelector(container) : (container || document.body);
    this.opt = Object.assign({}, DEFAULTS, options);

    // 마우스가 있는 환경에서만 동작(터치=네이티브 커서 유지). 모션 최소화면 morph 끄고 즉시 추종.
    this._fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    this._reduced = this.opt.respectReducedMotion && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this._fine) return;   // 터치 기기 등: 아무것도 만들지 않고 종료(destroy 호출돼도 안전)

    this._running = false; this._raf = null; this._shown = false; this._last = 0;
    this._state = 'default'; this._fillEl = null; this._fillRound = false;
    this._morphLevel = this.opt.morphLevel;
    this._morphMax = this.opt.morphMax;
    this.pointer = new Vec2(innerWidth / 2, innerHeight / 2);
    this.pos = new Vec2(this.pointer.x, this.pointer.y);
    this.vel = new Vec2();
    this.morph = new Vec2(1, 1);
    this.dotScale = 1; this.dotTarget = 1;    // 둥근 점 표시량 (기본 1, 채움 중 0)
    this.fillScale = 0; this.fillTarget = 0;  // 채움 표시량 (기본 0, 채움 중 1)
    this.labelScale = 0;                      // 라벨 상태 점 확대용(별도)
    this.currentCursorPosition = this.pos;    // 페어 효과(cursor-target) 자석 동기화용
    this._init();
  }

  _init() {
    const { opt } = this;
    // 화면 전체를 덮는 고정 레이어(클릭 통과). 처음엔 opacity 0 → 첫 마우스 이동 때 페이드인.
    const root = this.root = document.createElement('div');
    root.className = 'smooth-cursor';
    Object.assign(root.style, {
      position: 'fixed', inset: '0', zIndex: String(opt.zIndex),
      pointerEvents: 'none', opacity: '0', transition: 'opacity .3s ease',
    });
    if (opt.blendDifference) root.style.mixBlendMode = 'difference';

    // 보간된 위치로 translate 되는 컨테이너. 자식(채움·점·라벨)은 이 안에서 transform 만 한다.
    const main = this.mainEl = document.createElement('div');
    Object.assign(main.style, { position: 'absolute', left: '0', top: '0', width: '0', height: '0' });

    // 채움 레이어 (버튼 모양·크기로 그려짐, 점 뒤)
    const fill = this.fillEl = document.createElement('div');
    Object.assign(fill.style, centered(opt.size), {
      borderRadius: '50%', background: opt.color, willChange: 'transform',
      transform: 'scale(0)',
    });
    // 둥근 점
    const deco = this.decoEl = document.createElement('div');
    Object.assign(deco.style, centered(opt.size), {
      borderRadius: '50%', background: opt.color, willChange: 'transform',
      transition: 'background .35s ease',
    });
    // 라벨/아이콘
    const label = this.labelEl = document.createElement('div');
    Object.assign(label.style, {
      position: 'absolute', left: '0', top: '0', transform: 'translate(-50%,-50%)',
      whiteSpace: 'nowrap', fontSize: '14px', lineHeight: '1', fontWeight: '500',
      color: opt.textColor, opacity: '0', transition: 'opacity .2s ease', pointerEvents: 'none',
    });
    // 쌓임 순서: 채움(뒤) → 점(앞) → 라벨(맨 앞). 채움이 점 뒤라 전환 시 점이 채움 위로 자연스레 녹아든다.
    main.appendChild(fill); main.appendChild(deco); main.appendChild(label);
    root.appendChild(main);
    document.body.appendChild(root);

    if (opt.hideNative) {
      // OS 커서 숨김(커스텀 커서만 보이게). a/button 등 기본 cursor:pointer 도 덮어쓴다.
      this._styleEl = document.createElement('style');
      this._styleEl.textContent = `html,body,a,button,[data-cursor],[data-cursor-fill]{cursor:none !important;}`;
      document.head.appendChild(this._styleEl);
    }
    this._curDot = opt.color; this._curText = opt.textColor;

    // 마우스 이동: 목표 좌표 갱신 + 첫 이동 시 페이드인 + 커서 밑 요소 평가(상태 전환)
    this._onMove = (e) => {
      this.pointer.set(e.clientX, e.clientY);
      if (!this._shown) { this._shown = true; root.style.opacity = '1'; }
      this._evalTarget(e.target);
    };
    // 창 밖으로 나가면 숨기고, 다시 들어오면(동작 중일 때만) 보인다
    this._onLeave = () => { root.style.opacity = '0'; this._shown = false; };
    this._onEnter = () => { if (this._running) { root.style.opacity = '1'; this._shown = true; } };
    window.addEventListener('mousemove', this._onMove, { passive: true });
    document.addEventListener('mouseleave', this._onLeave);
    document.addEventListener('mouseenter', this._onEnter);

    if (opt.autoStart) this.start();
  }

  /** 커서 밑 요소를 보고 색 테마와 상태(채움>라벨>기본 우선순위)를 정한다 */
  _evalTarget(node) {
    if (!node || node.nodeType !== 1) return;
    const { opt } = this;
    // 가장 가까운 data-cursor-theme 조상에서 색 테마 적용(없으면 기본색)
    const themed = node.closest?.(`[${opt.themeAttr}]`);
    const tn = themed?.getAttribute(opt.themeAttr);
    this._baseColors = tn && opt.themes[tn] ? opt.themes[tn] : { dot: opt.color, text: opt.textColor };
    this._applyDotColor(this._baseColors.dot);
    this.labelEl.style.color = this._baseColors.text;

    // 우선순위: 채움 타깃(버튼) > 라벨 타깃(텍스트 링크) > 기본(점)
    const fillEl = node.closest?.(opt.fillSelector);
    if (fillEl) return this._setState('fill', fillEl);
    const lbl = node.closest?.(opt.labelSelector);
    if (lbl) return this._setState('label', lbl);
    this._setState('default');
  }

  _setState(state, el) {
    const { opt } = this;
    if (state === 'fill') {
      if (this._state === 'fill' && el === this._fillEl) return;
      this._state = 'fill'; this._fillEl = el;
      // 채움을 버튼 모양·크기로 (원본 크기 렌더 → 선명, border-radius 상속 → 모양 정확)
      const w = el.offsetWidth || el.getBoundingClientRect().width;
      const h = el.offsetHeight || el.getBoundingClientRect().height;
      const br = getComputedStyle(el).borderRadius;
      const col = (getComputedStyle(el).getPropertyValue(opt.fillVar).trim()) || opt.color;
      Object.assign(this.fillEl.style, centered(w, h), { borderRadius: br, background: col });
      // 채움 중 morph는 원본 그대로(morphLevel 0.002, 상한 1.3). 원형이면 진행방향 회전까지
      // 적용해 둥근 점처럼 방향 스쿼시(원은 회전 대칭이라 박힘 없음), 비정원은 축정렬만.
      this._fillRound = isRound(w, h, br);
      this._morphLevel = opt.morphLevelHover;   // 원본: 채움 중 0.002
      this._morphMax = opt.morphMax;            // 원본: 1.3
      this.dotTarget = 0; this.fillTarget = 1;     // 점 줄고 채움 자람(점이 채움으로 변형)
      this.labelEl.style.opacity = '0';
      return;
    }
    this._fillEl = null; this._fillRound = false; this._morphMax = opt.morphMax;
    if (state === this._state && state !== 'label') return;
    this._state = state;
    if (state === 'label') {
      this._morphLevel = opt.morphLevelHover;
      const text = el?.getAttribute(opt.labelAttr);
      const icon = el?.getAttribute(opt.iconAttr);
      this.labelEl.innerHTML = icon || '';
      if (text) this.labelEl.textContent = text;
      this.dotTarget = opt.hoverScale; this.fillTarget = 0;
      this.labelEl.style.opacity = (text || icon) ? '1' : '0';
    } else { // default
      this._morphLevel = opt.morphLevel;
      this.dotTarget = 1; this.fillTarget = 0;
      this.labelEl.style.opacity = '0';
    }
  }

  _applyDotColor(dot) {
    if (this._curDot === dot) return;
    this._curDot = dot;
    this.decoEl.style.background = dot;
  }

  _frame = (now) => {
    if (!this._running) return;
    this._raf = requestAnimationFrame(this._frame);
    // 델타타임(초). 첫 프레임은 16ms 가정, 탭 전환 등으로 튀면 0.05s 로 캡(주사율 독립 보간).
    let dt = this._last ? (now - this._last) / 1000 : 0.016;
    this._last = now;
    dt = Math.min(dt, 0.05);

    const { opt } = this;
    // 프레임 보간 계수: speed*dt 를 0~1 로. 모션 최소화면 1(=즉시 도달, 추종 지연·morph 없음).
    const a = (s) => this._reduced ? 1 : clamp(s * dt, 0, 1);

    // 점 위치를 포인터로 lerp(딜레이 추종). 거의 도달하면 스냅해 미세 떨림 방지.
    this.pos.lerp(this.pointer, a(opt.mainSpeed));
    if (this.pointer.distTo(this.pos) < 0.01) this.pos.copy(this.pointer);

    // 속도 = 포인터와 점의 간격(빠를수록·멀수록 큼) → morph 의 입력
    this.vel.set(this.pointer.x - this.pos.x, this.pointer.y - this.pos.y);
    const speed = Math.abs(this.vel.x) + Math.abs(this.vel.y);
    const mMax = this._morphMax;
    if (this._reduced) this.morph.set(1, 1);
    else this.morph.set(
      Math.min(1 + speed * this._morphLevel, mMax),
      Math.min(Math.max(1 - speed * this._morphLevel * 0.25, 0.5), mMax),
    );
    const angle = Math.atan2(this.vel.y, this.vel.x) * 180 / Math.PI;  // 진행 방향(도)

    // 점 표시량(dotScale)과 채움 표시량(fillScale)을 각자의 목표로 lerp →
    // 버튼 진입 시 점은 0으로, 채움은 1로 동시에 가며 '점→채움' 크로스페이드(흡수 아님).
    const sa = a(opt.scaleSpeed);
    this.dotScale += (this.dotTarget - this.dotScale) * sa;
    this.fillScale += (this.fillTarget - this.fillScale) * sa;

    // 컨테이너만 위치 이동(GPU translate3d). 자식들은 아래에서 scale/rotate 만.
    this.mainEl.style.transform = `translate3d(${this.pos.x}px, ${this.pos.y}px, 0)`;
    const mx = this.morph.x, my = this.morph.y;
    // 둥근 점: 진행 방향으로 회전 + 늘어남(원이라 회전은 안 보이고 stretch가 방향성을 가짐 = 쫀득 스쿼시)
    this.decoEl.style.transform = `rotate(${angle}deg) scale(${Math.max(this.dotScale * mx, 0.0001)}, ${Math.max(this.dotScale * my, 0.0001)})`;

    if (this._fillRound) {
      // 원형 채움: 둥근 점과 동일하게 회전+풀 스쿼시(원은 회전 대칭이라 박힘 없이 더 쫀득)
      this.fillEl.style.transform = `rotate(${angle}deg) scale(${Math.max(this.fillScale * mx, 0.0001)}, ${Math.max(this.fillScale * my, 0.0001)})`;
    } else {
      // 비정원 채움: 회전 금지(박힘 방지) — stretch는 진행 방향의 x/y 성분만 축정렬로 살짝
      const dirAbs = Math.abs(this.vel.x) + Math.abs(this.vel.y) || 1;
      const fx = 1 + (mx - 1) * (Math.abs(this.vel.x) / dirAbs);
      const fy = 1 + (mx - 1) * (Math.abs(this.vel.y) / dirAbs);
      this.fillEl.style.transform = `scale(${Math.max(this.fillScale * fx, 0.0001)}, ${Math.max(this.fillScale * fy, 0.0001)})`;
    }
  };

  /* ── 공개 API ───────────────────────────── */
  setTheme(name) { const th = this.opt.themes[name]; if (th) { this._baseColors = th; this._applyDotColor(th.dot); this.labelEl.style.color = th.text; } return this; }
  setOptions(partial = {}) { Object.assign(this.opt, partial); return this; }

  /* ── 라이프사이클 ───────────────────────── */
  start() { if (!this.root || this._running) return this; this._running = true; this._last = 0; this._raf = requestAnimationFrame(this._frame); return this; }
  stop() { this._running = false; if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; return this; }
  /** rAF 중단 + 모든 리스너·DOM·주입 스타일 제거(메모리 누수 방지, SPA 라우팅 시 필수) */
  destroy() {
    this.stop();
    window.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseleave', this._onLeave);
    document.removeEventListener('mouseenter', this._onEnter);
    this._styleEl?.parentNode?.removeChild(this._styleEl);
    this.root?.parentNode?.removeChild(this.root);
  }
}

/** 정원(회전해도 모양이 안 변하는 원)인지 — 정사각형 + 완전 라운드 */
function isRound(w, h, br) {
  if (Math.abs(w - h) > 2) return false;            // 정사각형 아니면 원 아님(알약·사각)
  const first = String(br).trim().split(/\s+/)[0] || '0';
  if (first.includes('%')) return parseFloat(first) >= 50;
  return parseFloat(first) >= w / 2 - 1;            // px 반경이 반지름 이상이면 원
}

/** 0,0 기준 중앙정렬된 w×h 박스 스타일 */
function centered(w, h = w) {
  return {
    position: 'absolute', left: '0', top: '0',
    width: w + 'px', height: h + 'px',
    marginLeft: -(w / 2) + 'px', marginTop: -(h / 2) + 'px',
  };
}

export default SmoothCursor;
