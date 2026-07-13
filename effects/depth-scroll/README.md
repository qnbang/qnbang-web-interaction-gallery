# Depth Scroll

가로 이미지 스트립을 스크롤할 때 **스크롤 속도**를 정점 곡률로 바꿔, 평면이 원통 안쪽처럼 휘고 원근 카메라로 **공간감(깊이)** 을 내는 효과.

- 의존성: `three` (`>=0.160`, importmap으로 주입)

## 사용

```html
<div id="stage" style="position:relative;width:100%;height:78vh"></div>
<script type="importmap">
  { "imports": { "three": "../../shared/vendor/three.module.min.js" } }
</script>
<script type="module">
  import { DepthScroll } from './depth-scroll.js';
  const fx = new DepthScroll('#stage', {
    images: ['img/1.webp', 'img/2.webp', 'img/3.webp'],   // 필수
  });
</script>
```

## 옵션 (기본값)

| 옵션 | 기본 | 설명 |
|---|---|---|
| `images` | `[]` | **필수.** 이미지 URL 배열 (`repeat`만큼 반복돼 무한 스트립) |
| `spacing` / `planeW` / `planeH` | `3.4` / `2.3` / `3.05` | 간격·사진 크기(3:4) |
| `segments` | `24` | 평면 분할 — 곡면 매끄러움 |
| `repeat` | `3` | 이미지 반복(무한 wrap용) |
| `fov` / `camZ` | `42` / `5.2` | 원근 화각·카메라 거리 (클수록 공간감↑) |
| `wheelScale` / `lerp` / `velGain` / `maxVel` | `0.0022` / `0.085` / `9` / `2.6` | 스크롤 물리(관성·속도) |
| `curve` | `0.55` | **uCurveStrength** — 스크롤 시 위아래 출렁임 |
| `curveFreq` | `0.42` | **uCurveFrequency** — 파도 촘촘함 |
| `depth` | `0.055` | **uDepthCurveStrength** — 상시 깊이 곡률(공간감) |
| `velDepth` | `0.9` | 속도 붙을 때 깊이 가중 |
| `chromatic` | `0.018` | 속도 기반 RGB 색수차(운동 잔상) |
| `parallax` | `true` | 마우스 이동 → 시점 패럴랙스 |
| `pauseWhenHidden` | `true` | 화면 밖이면 루프 정지 |

## API

```js
fx.start(); fx.stop(); fx.resize();
fx.setOptions({ depth: 0.09, curve: 0.9 });  // 변형 다이얼 실시간 조정
fx.destroy();                                 // 이벤트·GPU·DOM 자원 해제
```

## 동작 원리

**핵심: 스크롤 *위치*가 아니라 *속도(velocity)*를 정점 곡률로 바꾼다.**

1. **PerspectiveCamera(원근)** — 깊이의 토대. 가까운 평면은 크게, 먼 평면은 작게.
2. **상시 깊이 곡률** — vertex에서 `world.z -= wx*wx*uDepth` (월드 X의 제곱). 중앙은 앞, 양 끝은 뒤 → 정지해도 원통 안쪽 같은 공간감.
3. **속도 → 곡률** — 관성 스크롤에서 프레임 이동량(velocity)을 뽑아 `uVelocity`로 전달. `world.y += sin(wx*freq)*curve*v`, `world.z += cos(...)*velDepth*v` → 빠를수록 출렁이고, 멈추면(lerp 감속) 평평해진다.
4. **색수차** — fragment에서 속도에 비례해 R/B 채널을 좌우로 분리 → 모션 잔상.
5. **무한 wrap** — 각 평면 X를 `-total/2 ~ +total/2` 로 순환시켜 끝없이 스크롤.

## 성능

- 평면 N장(= `images.length × repeat`)의 단일 draw, 셰이더는 가벼움. 모바일도 무난.
- `pauseWhenHidden`으로 화면 밖에서는 rAF 정지. `destroy()`가 텍스처·지오메트리·렌더러를 모두 dispose.

## 출처

`meech213.com` 의 `main.js`(Three.js TSL 노드 시스템)에서 deform 메커니즘(`uScrollSpeed`/`uCurveStrength`/`uCurveFrequency`/`uDepthCurveStrength`)을 분석해 표준 Three.js + GLSL로 재구현. **원 사이트 소스 미복제** — 알고리즘만 재현.
