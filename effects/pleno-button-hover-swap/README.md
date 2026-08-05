# PLENO Button Hover Swap

버튼의 전경·배경과 화살표 위치를 hover/tap variant로 교대하는 CTA 피드백

## 원본 적용 위치

- CTA and Footer ButtonColor
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- spring .4s bounce .2; fine-pointer hover; tap feedback
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoButtonHoverSwap } from './pleno-button-hover-swap.js';
const effect = new PlenoButtonHoverSwap('#effect');
// effect.replay();
// effect.destroy();
```

CTA와 푸터 링크에서 클릭 가능성을 즉시 강조할 때
