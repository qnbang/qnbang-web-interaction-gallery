# PLENO Hero Parallax

첫 화면 헤드라인이 스크롤 속도와 다른 비율로 이동하는 히어로 패럴랙스

## 원본 적용 위치

- Artists and Contact hero withFX speed=120
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- scroll-linked; source speed 120
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoHeroParallax } from './pleno-hero-parallax.js';
const effect = new PlenoHeroParallax('#effect');
// effect.replay();
// effect.destroy();
```

대형 타이포 히어로에 깊이와 다음 섹션 진입감을 줄 때
