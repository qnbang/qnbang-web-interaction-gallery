# Particle Morph — Sphere → Ring (`particle-morph`)

3D 메시(GLTF 또는 구체) 표면을 **발광 점구름**으로 샘플해, 평상시 천천히 회전하는 **꽉 찬 구**가 활성 시 **파티클 링(스트로크 원)**으로 부드럽게 모핑(바운스 없는 지수보간)되고 시계방향으로 돈다. 링 중앙이 비어 그 자리에 버튼 등을 드러낼 수 있다.

> framework: vanilla · entry `particle-morph.js` · export `ParticleMorph` · 의존 `three`(모델 사용 시 `three/addons`)
> 출처: 큐앤뱅 리믹스6 푸터 블루베리 입자에서 일반화(footer visibility·`footerberry:*` 이벤트·모바일 탭 토글 훅 제거 → `setActive`/`onActiveChange`로 대체).

## 설치 / 사용

```html
<script type="importmap">
  { "imports": { "three": "../../shared/vendor/three.module.min.js" } }
</script>
<div id="stage" style="position:relative;width:100vw;height:100vh"></div>
<script type="module">
  import { ParticleMorph } from './particle-morph.js';
  const morph = new ParticleMorph('#stage', {
    count: 60000,
    color: 0xb9c6ff,
    // modelUrl: '/models/blueberry.glb',  // 생략 시 구체 점구름
  });
  // 링 전환 시 중앙 버튼 토글
  morph.onActiveChange = (on) => myCtaButton.classList.toggle('show', on);
</script>
```

- 기본은 `hoverActivate:true` — 커서가 화면 중앙(`activeR`) 근처에 오면 자동으로 링이 된다.
- 터치/외부 제어는 `hoverActivate:false`로 두고 `morph.setActive(true/false)`(예: 탭 토글)로 제어.
- **모델 없이 구체만** 쓰면 `three/addons` 매핑이 필요 없다(GLTFLoader는 `modelUrl`이 있을 때만 동적 import).

## API

| 멤버 | 설명 |
|---|---|
| `new ParticleMorph(container, options)` | 캔버스 생성·부착 |
| `setActive(on)` | 구↔링 전환(외부 제어) |
| `active` (getter) | 현재 활성 여부 |
| `start()` / `stop()` / `resize()` / `setOptions(p)` / `destroy()` | |
| `onActiveChange = (active) => {}` | 전환 콜백(중앙 버튼 토글 등) |

## 주요 옵션

| 옵션 | 기본 | 설명 |
|---|---|---|
| `count` | `60000` | 입자 수(저사양 자동 20000) |
| `color` | `0xb9c6ff` | 입자 색(가산 글로우) |
| `pointSize` | `3.0` | 점 크기(px) |
| `spin` | `0.16` | 구 회전 속도(rad/s) |
| `ringInner`/`ringOuter`/`ringZ` | `1.4`/`1.9`/`0.16` | 링 반경·두께 |
| `ringSpin` | `0.07` | 링 회전 속도(시계방향) |
| `activeR` | `0.3` | hoverActivate 중앙 반응 반경 |
| `hoverActivate` | `true` | 중앙 근접 자동 활성 |
| `modelUrl` | `null` | GLTF URL(없으면 구체) |
| `lowPower` | `null` | `null`=자동(`window.QNB.device`) |
| `pauseWhenHidden` | `true` | 화면 밖이면 루프 정지 |

## 동작 원리 / 성능

- GLB 표면을 **면적 가중**으로 N개 점 샘플 → 균일한 점구름. 법선·광원으로 매 프레임 셰이딩(`aBright`).
- 가산 블렌딩(`AdditiveBlending`) + 원형 점 마스크로 겹칠수록 발광.
- 구↔링은 **지수보간**(오버슈트 없음). 링은 안~밖 반경 사이를 면적 균등으로 채운 띠.
- 매 프레임 N개 위치를 CPU 계산 후 GPU 업로드 — 저사양에선 입자 수·pixelRatio 자동 감축(`lowPower`).
- 화면 밖이면 IntersectionObserver로 정지.

## 메모

- 원본은 브랜드 GLB(블루베리)를 표면 형상으로만 썼다(텍스처 무관). 모델은 동봉하지 않으니 `modelUrl`로 지정하거나 구체로 쓴다.
- 원본의 푸터 CTA 버튼 reveal은 [`magnetic-button`](../magnetic-button/) 효과와 짝으로 쓰면 좋다(`onActiveChange`에서 `reveal()`).
