# PLENO Directional Navbar

아래로 스크롤하면 80px 위로 숨고 위로 스크롤하면 복귀하는 방향 감지 내비게이션

## 원본 적용 위치

- Global Navbar
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 0.8s · cubic-bezier(.6,.2,0,1) · y 0↔-80
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoDirectionalNavbar } from './pleno-directional-navbar.js';
const effect = new PlenoDirectionalNavbar('#effect');
// effect.replay();
// effect.destroy();
```

긴 페이지에서 화면을 확보하면서 상향 탐색 시 메뉴를 즉시 돌려줄 때
