# PLENO Fluid Pixels

이미지를 입자 격자로 샘플링해 커서 반발·소용돌이·복귀력으로 변형하는 캔버스 효과

## 원본 적용 위치

- Home, Footer, CardParallax FluidPixelsEffect
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- radius 30/65; friction .8/.89; elasticity .15/.75; return .01; DPR capped
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoFluidPixels } from './pleno-fluid-pixels.js';
const effect = new PlenoFluidPixels('#effect');
// effect.replay();
// effect.destroy();
```

로고·인물·그래픽에 직접 만지는 듯한 유기적 반응을 줄 때
