# PLENO Grid Line Reveal

세로 그리드 라인이 위쪽 오프셋에서 내려오며 순차적으로 그려지는 구조선 리빌

## 원본 적용 위치

- GridLine across all page types
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 1s · cubic-bezier(.6,.2,0,1) · delays 0/.04/.08/.2s · y -400/-900
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoGridLineReveal } from './pleno-grid-line-reveal.js';
const effect = new PlenoGridLineReveal('#effect');
// effect.replay();
// effect.destroy();
```

에디토리얼 그리드를 장식이 아니라 장면 전환 장치로 사용할 때
