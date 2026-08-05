# PLENO Lenis Smooth Scroll

휠 입력을 감쇠 보간하는 세로 스무스 스크롤

## 원본 적용 위치

- All routes — Lenis smooth=true, intensity=12
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- lerp-equivalent intensity 12 · vertical · finite
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoLenisSmoothScroll } from './pleno-lenis-smooth-scroll.js';
const effect = new PlenoLenisSmoothScroll('#effect');
// effect.replay();
// effect.destroy();
```

긴 에디토리얼 페이지에서 스크롤과 패럴랙스의 시간축을 안정화할 때
