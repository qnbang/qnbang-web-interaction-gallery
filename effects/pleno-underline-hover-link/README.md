# PLENO Underline Hover Link

밑줄이 한쪽으로 빠진 뒤 반대편에서 다시 그려지는 링크 hover

## 원본 적용 위치

- Global menu/footer, Contact, 404
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- transform-origin swap; 0.4s spring/tween family
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoUnderlineHoverLink } from './pleno-underline-hover-link.js';
const effect = new PlenoUnderlineHoverLink('#effect');
// effect.replay();
// effect.destroy();
```

전화·메뉴·푸터처럼 반복되는 텍스트 링크에 일관된 피드백을 줄 때
