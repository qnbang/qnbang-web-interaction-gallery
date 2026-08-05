# PLENO Card Parallax

카드의 포인터 위치에 따라 미디어가 기울고 내부 유체 픽셀 레이어가 반응하는 카드

## 원본 적용 위치

- Home, Artists, Artist detail CardParallax
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- pointer-normalized tilt; ParallaxMedia 40; FluidPixels radius 30
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoCardParallax } from './pleno-card-parallax.js';
const effect = new PlenoCardParallax('#effect');
// effect.replay();
// effect.destroy();
```

대형 포스터 카드에 링크임을 알리는 촉각적 hover 깊이가 필요할 때
