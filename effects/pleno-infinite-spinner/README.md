# PLENO Infinite Spinner

컬렉션 추가 로딩 중 점/링이 반복 회전하고 완료 시 숨겨지는 로더

## 원본 적용 위치

- Artists collection Spinner Loading/Hidden
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- linear loop; state-driven hidden variant
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoInfiniteSpinner } from './pleno-infinite-spinner.js';
const effect = new PlenoInfiniteSpinner('#effect');
// effect.replay();
// effect.destroy();
```

무한 목록의 다음 묶음을 가져오는 동안 작은 진행 상태가 필요할 때
