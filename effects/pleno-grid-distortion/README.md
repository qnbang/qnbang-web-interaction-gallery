# PLENO Grid Distortion

이미지 texture와 grid 크기의 displacement Data Texture를 사용하는 raw WebGL 모자이크 왜곡입니다. 포인터 속도를 가까운 셀에 누적하고, GLSL에서 `texture2D(uTexture, uv - 0.02 * offset.rg)`로 샘플 좌표를 이동합니다.

## 원본 적용 위치

- [PLENO Grid Distortion / Image w mosaic](https://www.pleno-ent.com/ko/)

## 모션 사양

- 기본값: grid 70, mouse .3, strength .15, relaxation .9, hover multiplier 1.5, DPR cap 2
- `pointerenter`/`pointermove`는 inverse-distance(최대 10) 가중치로 velocity를 셀에 누적합니다. leave 뒤에는 relaxation으로 자연 복귀합니다.
- WebGL 또는 texture 초기화가 실패하면 정적 이미지로 안전하게 폴백합니다. `prefers-reduced-motion: reduce`도 정적 이미지를 렌더합니다.

## 사용

```js
import { PlenoGridDistortion } from './pleno-grid-distortion.js';
const effect = new PlenoGridDistortion('#effect');
// effect.replay();
// effect.destroy();
```

히어로·CTA·푸터의 큰 이미지에 국소적인 렌즈 반응을 줄 때
