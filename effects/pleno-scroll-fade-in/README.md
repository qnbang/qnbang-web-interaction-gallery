# PLENO Scroll Fade In

요소가 뷰포트 임계점에 닿을 때 opacity를 올리는 기본 섹션 등장

## 원본 적용 위치

- Home, Artists, Contact, Detail generated appear effects
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 1s · cubic-bezier(.6,.2,0,1), common delays .2/.4/.8s
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoScrollFadeIn } from './pleno-scroll-fade-in.js';
const effect = new PlenoScrollFadeIn('#effect');
// effect.replay();
// effect.destroy();
```

텍스트·카드·폼 블록의 정보 위계를 순차적으로 드러낼 때
