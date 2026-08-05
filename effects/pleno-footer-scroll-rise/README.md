# PLENO Footer Scroll Rise

문서 끝에서 푸터가 아래에 잠겨 있다가 스크롤 진행에 맞춰 상승하는 리빌

## 원본 적용 위치

- Global footer / backup-footer targets
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- scroll-linked y 320→0; source variants also use y 1200→0
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoFooterScrollRise } from './pleno-footer-scroll-rise.js';
const effect = new PlenoFooterScrollRise('#effect');
// effect.replay();
// effect.destroy();
```

콘텐츠 끝을 다음 장면처럼 연결하는 대형 푸터에
