# PLENO Obsession Orbits

서로 다른 속도와 방향의 원형 레이어가 계속 회전하며 중앙의 가치 문구를 연결하는 모션 그래픽

## 원본 적용 위치

- Home OBSESSIONS STORYTELLING
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 14/20/28/12s linear loops · ±360° · offscreen pause
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoObsessionOrbits } from './pleno-obsession-orbits.js';
const effect = new PlenoObsessionOrbits('#effect');
// effect.replay();
// effect.destroy();
```

브랜드 가치·원칙을 정적 다이어그램보다 살아 있는 시스템으로 보일 때
