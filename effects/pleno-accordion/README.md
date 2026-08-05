# PLENO Accordion

질문 탭 시 높이·opacity·콘텐츠 y와 plus 아이콘 회전을 함께 전환하는 아코디언

## 원본 적용 위치

- Contact Notice / Accordion_1
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- height auto + opacity; content y -10; icon 0→45°; tap scale .98
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoAccordion } from './pleno-accordion.js';
const effect = new PlenoAccordion('#effect');
// effect.replay();
// effect.destroy();
```

문의 페이지의 공지·FAQ처럼 긴 답변을 접어 둘 때
