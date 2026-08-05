# PLENO Parallax Media

클리핑된 프레임 안의 이미지가 세로 스크롤에 반대 방향으로 이동하는 미디어 패럴랙스

## 원본 적용 위치

- Work Slide Media, CardParallax, Artist detail
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- vertical parallax 40; focalX 30/45/50 variants
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoParallaxMedia } from './pleno-parallax-media.js';
const effect = new PlenoParallaxMedia('#effect');
// effect.replay();
// effect.destroy();
```

아티스트 카드와 상세 이미지에 깊이를 주되 프레임 위치는 고정할 때
