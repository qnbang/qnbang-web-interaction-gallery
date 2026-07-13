# 효과 작성 규칙 (Conventions)

이 컬렉션의 모든 웹 인터랙션 효과는 아래 규칙을 따른다. 일관성이 곧 재사용성·검색성이다.

## 1. 폴더 구조 — 효과 1개 = 자기완결 폴더

```
effects/<name>/
├── effect.json        ← 메타데이터 (필수, 스키마는 §3)
├── <name>.js          ← 효과 모듈 (필수, ES 모듈)
├── README.md          ← 문서: API·옵션·동작원리·성능 (필수)
├── demo.html          ← 단독 실행 데모 (필수)
└── preview.png        ← 갤러리 썸네일 (선택, 1600×1000 권장)
```

- `<name>`은 kebab-case (예: `fluid-particles`, `magnetic-button`).
- 효과 폴더 안에서 모든 게 끝나야 한다. 외부 의존은 `shared/`(공유 벤더)와 `effect.json`의 `dependencies`로만.

## 2. 모듈 규약 (`<name>.js`)

- **ES 모듈**. named export + default export 둘 다 제공.
- 외부 라이브러리는 **bare specifier**로 import (예: `import * as THREE from 'three'`).
  실제 경로 매핑은 데모/소비측의 **importmap**이 담당한다. (모듈에 경로 하드코딩 금지)
- 진입점은 **클래스** 또는 **팩토리 함수**:
  - 클래스: `new Effect(container, options)` — `container`는 `HTMLElement|선택자`.
  - 팩토리: `effect(container, options)` → 핸들 객체 반환.
- **표준 라이프사이클 메서드**(해당되면 구현):
  - `start()` / `stop()` — 루프 시작·정지
  - `destroy()` — 이벤트·타이머·GPU·DOM 자원 전부 해제 (필수)
  - `resize()` — 컨테이너 크기 변화 반영
  - `setOptions(partial)` 또는 `opt` 직접 변경 — 런타임 파라미터 조정
- **부작용 규칙**:
  - 컨테이너가 `position:static`이면 `relative`로 승격.
  - 오버레이 캔버스는 `position:absolute; inset:0; pointer-events:none` (위 콘텐츠 클릭 방해 금지).
  - `pauseWhenHidden`: `IntersectionObserver`로 화면 밖이면 루프 정지(성능).
  - 옵션은 `DEFAULTS` 객체 1곳에 모으고 `Object.assign`으로 병합.
- 접근성/모션: 가능하면 `prefers-reduced-motion` 존중 옵션 제공.

## 3. `effect.json` 스키마

```jsonc
{
  "name": "fluid-particles",          // = 폴더명 (kebab-case)
  "title": "Fluid Particles",         // 사람이 읽는 이름
  "description": "한 줄 설명(무엇을 하는 효과인가)",
  "whenToUse": "언제 쓰면 좋은가(상황·맥락)",
  "tags": ["particles","mouse","webgl"], // 검색용 키워드
  "framework": "vanilla",             // "vanilla" | "react" | "vue"  (없으면 vanilla로 간주) — §8
  "entry": "fluid-particles.js",      // 모듈/컴포넌트 파일 (react면 .tsx)
  "export": "FluidParticles",         // 주 export 이름
  "type": "class",                    // vanilla: "class"|"function" / react: "component"
  "dependencies": { "three": ">=0.160" }, // 외부 의존(없으면 {})
  "demo": "demo.html",                // vanilla: demo.html / react: demo.tsx 또는 README 사용예
  "version": "1.0.0",
  "tech": ["Three.js","WebGL"],       // 사용 기술(선택)
  "api": { /* 요약(선택) */ },
  "origin": "출처/영감/저작권 메모(선택). 클론 추출본이면 clones/_완료/<name> 경로",
  "created": "YYYY-MM-DD"
}
```

`registry.json`(전체 인덱스)은 `node build-registry.mjs`가 모든 `effect.json`을 모아 생성한다. 손으로 고치지 않는다.

## 4. 데모 규약 (`demo.html`)

- 단독으로 열려야 한다(서버 루트에서). 상단에 **importmap**으로 공유 벤더 매핑:
  ```html
  <script type="importmap">
    { "imports": { "three": "../../shared/vendor/three.module.min.js" } }
  </script>
  ```
- 모듈은 상대경로로 import: `import { Effect } from './<name>.js'`.
- 데모는 **무엇을 만지면 무슨 일이 일어나는지** 안내 문구 + 가능하면 실시간 파라미터 패널.

## 5. 새 효과 추가 절차

```bash
node new-effect.mjs <name> "<Title>" "<한 줄 설명>"   # _template 복제·치환
# → effects/<name>/ 생성됨. 모듈/데모/README 채우고:
node build-registry.mjs                              # 인덱스 갱신
node server.mjs                                      # 갤러리에서 확인
```

## 6. 품질 체크리스트 (머지 전)

- [ ] `effect.json` 채움(설명·태그·whenToUse·의존성)
- [ ] 모듈에 `destroy()`로 자원 누수 없음
- [ ] 데모가 importmap만으로 단독 실행됨
- [ ] README에 옵션표·API·동작원리·성능
- [ ] `node build-registry.mjs` 후 갤러리에 카드 표시·데모 정상
- [ ] 콘솔 0 에러
- [ ] (해당 시) 모바일/터치·`prefers-reduced-motion` 확인

## 7. 공유 자원 (`shared/`)

- 여러 효과가 쓰는 무거운 벤더(Three.js 등)는 `shared/vendor/`에 한 벌만 둔다.
- 효과별 고유 의존은 그 효과 폴더 안에 둔다.

## 8. 프레임워크 효과 (vanilla 외 — React / Vue)

클론 코딩(→ `clones/`)으로 모은 효과 중에는 React/Vue 컴포넌트로 된 것도 있다.
vanilla로 강제 재작성하지 않고 **프레임워크별로 수용·공존**한다. `effect.json`의 `framework`로 구분한다.

### 공통

- `framework`가 없으면 `"vanilla"`로 간주(기존 효과 호환). §1 폴더 구조·§3 메타·§6 체크리스트는 동일하게 적용.
- README는 모든 효과 필수. 프레임워크 효과는 README에 **설치 의존성·import 경로·사용 예**를 반드시 포함.
- `dependencies`에 프레임워크/플러그인 버전 명시(`react`, `gsap`, `framer-motion` 등).
- 자원 해제(언마운트 정리), `prefers-reduced-motion`은 프레임워크 방식으로라도 지킨다(§2 정신 유지).

### React 효과 (`framework: "react"`)

```
effects/<name>/
├── effect.json        ← framework:"react", type:"component", entry:"<name>.tsx"
├── <name>.tsx         ← "use client" + named + default export 컴포넌트
├── README.md          ← props 표 · 의존성 · 복붙 사용 예
├── demo.tsx           ← (선택) 데모 사용 예. 단독 importmap 실행은 어려우므로 README 예시로 대체 가능
└── preview.png
```

- 진입점은 **컴포넌트**(`new` 아님): `export const <Export> = (props) => ...` + `export default`.
- props 타입을 파일 상단에 `export type`으로 노출(소비측이 그대로 가져다 씀).
- vanilla처럼 importmap 단독 데모가 어렵다 → `demo.html` 대신 **README의 복붙 가능한 사용 예**가 데모 역할.
- 무거운 에셋(폰트·이미지·사운드)은 효과 폴더 안 `assets/`에 두고 상대경로 참조, README에 배치 안내.

### Vue 효과 (`framework: "vue"`)

- 위 React 규약에 준한다. 진입점은 `.vue` SFC 또는 컴포저블, `effect.json`에 `entry` 명시.

### 갤러리 표시

- `build-registry.mjs`는 `framework` 필드를 그대로 `registry.json`에 싣는다(스크립트 수정 불필요).
- `gallery.html`은 `framework` 배지로 vanilla/react/vue를 구분 표시한다(없으면 vanilla).
