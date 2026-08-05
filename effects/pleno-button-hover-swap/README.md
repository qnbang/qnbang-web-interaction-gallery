# PLENO Button Color

PLENO의 Button Color CTA를 재현합니다. 링크를 루트로 유지하고 좌·우 5개씩의 회색 3D 블록, 코너 글리프, 글자별 플리커를 결합합니다.

## 원본 적용 위치

- 원본: https://www.pleno-ent.com/ko/ (Button Color)

## 모션 사양

- fine pointer hover와 keyboard focus에서 `.7s cubic-bezier(.6,.2,0,1)`로 10개 블록이 열립니다.
- 행 지연은 `.10/.06/.05/.06/.10s`이며, 레이블은 80ms 간격으로 500ms 동안 랜덤 플리커합니다.
- `prefers-reduced-motion: reduce`에서는 3D·플리커 없이 최종 프레임을 표시합니다.

## 사용

```js
import { PlenoButtonHoverSwap } from './pleno-button-hover-swap.js';
const effect = new PlenoButtonHoverSwap('.button-unit', { label: 'CONTACT', variant: 'large' });
// effect.replay();
// effect.destroy();
```

`root`가 컨테이너면 내부의 `a.target`을, 링크 자체면 그 링크를 사용합니다. 터치 환경에서는 링크 밖의 `.pleno-button-replay`(44×44px)를 두면 `replay()`와 같은 플리커를 다시 실행합니다.
