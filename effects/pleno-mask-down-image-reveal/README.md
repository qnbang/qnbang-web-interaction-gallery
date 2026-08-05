# PLENO Mask-down Image Reveal

이미지 마스크가 위에서 아래로 열리고 내부 이미지는 미세하게 역이동하는 리빌

## 원본 적용 위치

- Contact ScrollRevealImage
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- animation mask-down · cubic ease · delay 0 · one-shot
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoMaskDownImageReveal } from './pleno-mask-down-image-reveal.js';
const effect = new PlenoMaskDownImageReveal('#effect');
// effect.replay();
// effect.destroy();
```

문의·소개 페이지의 단일 키 비주얼을 장면처럼 공개할 때
