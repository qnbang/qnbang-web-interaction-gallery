# PLENO Slideshow

자동재생·화살표·드래그·무한 순환을 지원하는 가로 슬라이드쇼

## 원본 적용 위치

- Home press/news: 3 responsive instances
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- spring stiffness 200/damping 40; infinite; mouse controls
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoSlideshow } from './pleno-slideshow.js';
const effect = new PlenoSlideshow('#effect');
// effect.replay();
// effect.destroy();
```

뉴스·프레스·이미지 카드 묶음을 한 뷰에서 넘길 때
