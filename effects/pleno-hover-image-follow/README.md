# PLENO Hover Image Follow

리스트 행을 호버하면 대응 이미지가 커서를 부드럽게 추종하며 진입·퇴장하는 효과

## 원본 적용 위치

- Artists List Item / HoverImageFollow
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- pointer smoothing; bottom-origin enter; fine pointer only
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoHoverImageFollow } from './pleno-hover-image-follow.js';
const effect = new PlenoHoverImageFollow('#effect');
// effect.replay();
// effect.destroy();
```

텍스트 인덱스에 썸네일 문맥을 추가하면서 목록 밀도를 유지할 때
