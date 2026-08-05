# PLENO Page Loader Sequence

첫 방문에서 브랜드 워드마크를 마스킹·슬라이드하고 본문을 인계하는 3단 로더

## 원본 적용 위치

- Home / Loading — Start → On Mount → End, desktop/mobile variants
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 0.8–1.15s stages · cubic-bezier(.645,.045,.355,1)
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoPageLoaderSequence } from './pleno-page-loader-sequence.js';
const effect = new PlenoPageLoaderSequence('#effect');
// effect.replay();
// effect.destroy();
```

홈 최초 진입의 브랜드 인트로와 초기 자산 로딩 지연을 하나의 연출로 감출 때
