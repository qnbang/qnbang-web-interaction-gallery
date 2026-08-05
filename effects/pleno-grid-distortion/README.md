# PLENO Grid Distortion

이미지 UV 격자를 포인터 근처에서 휘게 만드는 WebGL 스타일 왜곡

## 원본 적용 위치

- Home, CTA, Footer GridDistortion
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- grid 70/93 · hover multiplier 1.5 · DPR cap 2
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoGridDistortion } from './pleno-grid-distortion.js';
const effect = new PlenoGridDistortion('#effect');
// effect.replay();
// effect.destroy();
```

히어로·CTA·푸터의 큰 이미지에 국소적인 렌즈 반응을 줄 때
