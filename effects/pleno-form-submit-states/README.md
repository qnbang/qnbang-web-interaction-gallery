# PLENO Form Submit States

폼의 incomplete·pending·success·error 상태에 따라 버튼 라벨과 진행 피드백을 전환

## 원본 적용 위치

- Contact Button Form Email
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- Default/Loading/Disabled/Success/Error/Arrow variants
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoFormSubmitStates } from './pleno-form-submit-states.js';
const effect = new PlenoFormSubmitStates('#effect');
// effect.replay();
// effect.destroy();
```

이메일 문의 폼에서 제출 결과를 같은 버튼 자리에서 명확히 알려 줄 때
