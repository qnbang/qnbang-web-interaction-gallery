# PLENO Fullscreen Menu

배경 딤·메뉴 패널·링크 스태거·장식선이 함께 열리고 닫히는 전체화면 메뉴

## 원본 적용 위치

- Global Main overlay
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- backdrop .2s; links .8s with 500–640ms stagger · cubic-bezier(.32,.94,.6,1)
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoFullscreenMenu } from './pleno-fullscreen-menu.js';
const effect = new PlenoFullscreenMenu('#effect');
// effect.replay();
// effect.destroy();
```

소수의 상위 경로를 강한 브랜드 장면으로 제시할 때
