# PLENO Flicker Text Reveal

문자가 랜덤한 명멸을 거쳐 최종 불투명도로 정착하는 텍스트 리빌

## 원본 적용 위치

- Artists, Contact, Artist detail AnimatedTextReveal
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- flicker 120–150ms · intensity .7–.8 · one-shot
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoFlickerTextReveal } from './pleno-flicker-text-reveal.js';
const effect = new PlenoFlickerTextReveal('#effect');
// effect.replay();
// effect.destroy();
```

캡션·메타데이터에 디지털 질감을 더하되 레이아웃은 움직이지 않을 때
