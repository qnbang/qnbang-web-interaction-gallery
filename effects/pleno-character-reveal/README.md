# PLENO Character Reveal

글자를 분해해 아래/오른쪽 이동과 회전을 조합한 스태거 리빌

## 원본 적용 위치

- Home, Artists, Contact, Artist detail, CTA
- 원본 클론: `G:/.Codex/projects/260805_플레노엔터테인먼트_전체사이트클론/4_작업중`

## 모션 사양

- 1s · cubic-bezier(.645,.045,.355,1) · stagger 20ms; distance 100
- 트리거와 상태 전이는 원본 Framer 소스맵과 실제 미러 런타임을 함께 대조했다.
- `prefers-reduced-motion: reduce`에서는 반복·공간 이동을 즉시 완료한다.

## 사용

```js
import { PlenoCharacterReveal } from './pleno-character-reveal.js';
const effect = new PlenoCharacterReveal('#effect');
// effect.replay();
// effect.destroy();
```

히어로 제목·연도·CTA처럼 한 문장을 강하게 시작할 때
