# Fluid Particles

마우스 **유체 인터랙션 파티클**. 텍스트·이미지·좌표를 입자 군집으로 만들고, 마우스가 움직이면
그 이동 속도를 격자 속도장에 주입해 입자가 흐름을 타고 **마우스를 따라 흩어졌다가 제자리로 복귀**한다.

- 물리: CPU 격자 유체 시뮬레이션(Stam 계열 속도장 + 이류 + 스프링 복귀)
- 렌더: Three.js GPU 포인트(가산 블렌딩 옵션 — 겹치면 발광)
- 의존성: `three` (peer, importmap으로 주입)

## 사용

```html
<div id="stage" style="position:relative;width:100%;height:80vh"></div>
<script type="importmap">
  { "imports": { "three": "../../shared/vendor/three.module.min.js" } }
</script>
<script type="module">
  import { FluidParticles } from './fluid-particles.js';
  const fx = new FluidParticles('#stage', {
    text: { lines: ['start', 'with', 'mix.'] },
    color: '#ffffff', blending: 'additive',
  });
</script>
```

## 소스 (택1)

```js
text:  { lines: ['start','with','mix.'], fontWeight: 800, fontScale: 0.30, widthScale: 0.34, lineHeight: 0.86, maxFont: 300 }
image: { src: '/logo.png', threshold: 128, fit: 'contain', scale: 0.7 }   // 불투명 픽셀을 입자로
points: [{ x: 0.5, y: 0.5 }], normalized: true                            // 0..1, 아니면 픽셀
```

## 주요 옵션 (기본값)

| 옵션 | 기본 | 설명 |
|---|---|---|
| `color` | `#ffffff` | 입자 색 |
| `pointSize` | `2.8` | 점 크기(px) |
| `baseAlpha`/`alphaVariation` | `0.45`/`0.55` | 점 알파 |
| `blending` | `additive` | `additive`(발광) \| `normal` |
| `sampleStep` | `2` | 픽셀 샘플 간격(↓=조밀·무거움) |
| `cellSize` | `10` | 격자 셀 크기 |
| `brushRadius` | `48` | 마우스 힘 주입 반경 |
| `fluidDamping` | `0.99` | 흐름 지속성 |
| `sampleStrength` | `0.06` | 입자가 받는 흐름 비율 |
| `particleDamping` | `0.4` | 입자 감쇠 |
| `calmThreshold` | `0.5` | 이 속도 이하면 복귀 시작 |
| `returnStrength` | `50` | 복귀 스프링 강도 |
| `pauseWhenHidden` | `true` | 화면 밖이면 일시정지 |
| `pointerTarget` | `window` | 포인터 이벤트 대상(인스턴스별 컨테이너 권장) |

전체 옵션은 모듈의 `DEFAULTS` 참고.

## API

```js
fx.start(); fx.stop();
fx.setOpacity(0..1);       // 전체 페이드(스크롤 연동)
fx.setColor('#33e0ff');
await fx.setSource({ text:{lines:['hi']} });
await fx.resize();
fx.destroy();              // 이벤트·GPU·DOM 해제
fx.opt.brushRadius = 80;   // 런타임 파라미터 직접 변경 즉시 반영
```

## 동작 원리

1. 소스를 오프스크린 캔버스에 그려 불투명 픽셀 위치를 입자 home으로.
2. 마우스 이동 → 경로 보간하며 지나간 셀(±`brushRadius`)에 마우스 이동 속도를 `brushRadius/거리`로 주입.
3. 유체 솔브(발산→압력→속도보정, clamp, `×fluidDamping`) → 흐름 지속.
4. 입자가 자기 위치의 격자 속도를 `×sampleStrength`로 받아 마우스 방향으로 따라 이동.
5. 속도가 `calmThreshold` 이하로 잠잠해지면 home으로 smoothstep 스프링 복귀.

## 성능

입자 수는 컨테이너 크기·`sampleStep`·소스 밀도에 비례(데스크톱 풀스크린 텍스트 ≈ 4~5만).
무겁다면 `sampleStep`↑, `cellSize`↑, `pixelRatio`↓.

## 출처

newmixcoffee.com 히어로 인터랙션 동작을 분석해 동일 알고리즘을 직접 재구현(원 사이트 소스 미복제). `three`는 MIT.
