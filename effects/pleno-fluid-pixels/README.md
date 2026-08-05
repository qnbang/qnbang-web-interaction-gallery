# PLENO Fluid Pixels

Canvas 2D의 offscreen canvas와 `getImageData()`로 실제 PNG의 RGBA 픽셀을 샘플링하는 효과입니다. 각 격자는 원래 색·위치·속도·`returnScale`을 보존하며, 포인터 속도에 따라 반발과 소용돌이를 만들고 원위치로 복귀합니다.

기본값은 `particleSize: 6`, `radius: 65`, `repulsion: 6`, `returnSpeed: .01`, `friction: .89`, `swirl: .3`, `elasticity: .75`, 0.3초 fade이며 최대 파티클은 20,000개입니다. `prefers-reduced-motion`에서는 원본 이미지를 정적으로 표시합니다.

```js
import { PlenoFluidPixels } from './pleno-fluid-pixels.js';
const effect = new PlenoFluidPixels('#effect', { image: './chrome-head.png' });
effect.setImage('./chrome-face.png');
effect.replay();
effect.destroy();
```

원본: https://www.pleno-ent.com/ko/ / Fluid Pixel Text
