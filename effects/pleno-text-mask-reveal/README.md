# PLENO Text Mask Reveal

줄 단위 마스크 안에서 텍스트가 위로 열리는 인뷰 리빌

## 원본 적용 위치

- Home and Artist detail TextMask
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 0.4s base · stagger 40–80ms · threshold 100
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoTextMaskReveal } from './pleno-text-mask-reveal.js';
const effect = new PlenoTextMaskReveal('#effect');
// effect.replay();
// effect.destroy();
```

문장형 선언문과 섹션 헤드라인을 절제해서 등장시킬 때
