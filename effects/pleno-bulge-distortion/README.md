# PLENO Bulge Distortion

404 비주얼을 중심점에서 부풀렸다 복원하고 hover 위치로 왜곡 중심을 보간하는 효과

## 원본 적용 위치

- 404 BulgeDistortion
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- intro/reveal 1800ms · easeInOut · mouse smoothing .1
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoBulgeDistortion } from './pleno-bulge-distortion.js';
const effect = new PlenoBulgeDistortion('#effect');
// effect.replay();
// effect.destroy();
```

404·캠페인 스플래시처럼 한 장의 이미지를 강한 오류 장면으로 만들 때
