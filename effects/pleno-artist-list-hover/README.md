# PLENO Artist List Hover

아티스트 행의 제목 클립·인덱스·화살표·추종 이미지가 하나의 hover 상태로 전환되는 합성 인터랙션

## 원본 적용 위치

- Artists WorkTypeDirection + List Item Default/On Hover
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- spring variant .4s; character reveal 1s/20ms stagger
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoArtistListHover } from './pleno-artist-list-hover.js';
const effect = new PlenoArtistListHover('#effect');
// effect.replay();
// effect.destroy();
```

아티스트·프로젝트 디렉터리에서 행 전체를 큰 클릭 타깃으로 만들 때
