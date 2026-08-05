# PLENO Route Transition

페이지 이동 시 새 화면은 아래 20%에서 들어오고 이전 화면은 위 20%로 사라지는 전역 전환

## 원본 적용 위치

- Global PageEffectsProvider
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- enter/exit 0.8s · cubic-bezier(.32,.94,.6,1) · exit delay 20ms
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoRouteTransition } from './pleno-route-transition.js';
const effect = new PlenoRouteTransition('#effect');
// effect.replay();
// effect.destroy();
```

콘텐츠 중심 멀티 페이지 사이트에서 이동 방향감을 통일할 때
