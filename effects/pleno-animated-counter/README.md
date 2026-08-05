# PLENO Animated Counter

뷰포트 진입 시 숫자를 목표값까지 보간하고 포맷을 유지하는 카운터

## 원본 적용 위치

- ButtonColor / AnimatedCounter
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- autoStart; decimal formatting; one-shot
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoAnimatedCounter } from './pleno-animated-counter.js';
const effect = new PlenoAnimatedCounter('#effect');
// effect.replay();
// effect.destroy();
```

성과 수치·연도·지표를 정적인 텍스트보다 선명하게 인지시킬 때
