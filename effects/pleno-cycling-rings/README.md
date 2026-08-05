# PLENO Cycling Rings

서로 다른 지연을 가진 3축 링이 계속 회전하는 앰비언트 그래픽

## 원본 적용 위치

- Home CyclingWave (CyclingRings)
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 4s linear loops · 10 waves · tilt 45° · blur 20
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoCyclingRings } from './pleno-cycling-rings.js';
const effect = new PlenoCyclingRings('#effect');
// effect.replay();
// effect.destroy();
```

긴 스크롤 구간의 정적 여백에 낮은 주의도의 생동감을 줄 때
