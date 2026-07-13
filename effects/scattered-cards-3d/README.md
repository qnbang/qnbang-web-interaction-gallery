# Scattered Cards 3D (`scattered-cards-3d`)

여러 장의 카드가 3D 공간에 흩날려 떠 있다가, 스크롤하면 각자 **텀블링(회전)하며 위로 흐른다**. 진짜 3D(두께·조명·그림자·원근)이며, 0번 카드는 옵션으로 **클라이맥스**(중앙·거의 정면·가장 큰 크기로 카메라 앞을 스치는 마무리)로 둘 수 있다. 등장은 위치로만 처리해 번쩍임이 없고, 진행은 관성 lerp로 부드럽다.

> framework: vanilla · entry `scattered-cards-3d.js` · export `ScatteredCards3D` · 의존 `three`
> 출처: 큐앤뱅 리믹스6 Contact 명함 연출에서 **순수 효과만** 일반화(페이지 특화인 푸터 커튼·'Contact' 타이틀 평면은 제거).

## 설치 / 사용

```html
<script type="importmap">
  { "imports": { "three": "../../shared/vendor/three.module.min.js" } }
</script>
<div id="stage" style="position:fixed;inset:0"></div>
<script type="module">
  import { ScatteredCards3D } from './scattered-cards-3d.js';
  const cards = new ScatteredCards3D('#stage', {
    count: 19,
    frontImage: '/cards/front.png',          // 앞면 텍스처(없으면 단색 paperColor)
    backImages: ['/cards/back-a.png', '/cards/back-b.png'], // 뒷면(카드마다 순환)
    paperColor: 0x4545da,
  });
  // 스크롤 → 진행도(0~1)
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    cards.setProgress(max > 0 ? scrollY / max : 0);
  }, { passive: true });
</script>
```

`setProgress`는 네이티브 스크롤, Lenis, ScrollTrigger(`onUpdate`) 등 어떤 소스든 연결 가능.

## API

| 멤버 | 설명 |
|---|---|
| `new ScatteredCards3D(container, options)` | 컨테이너에 캔버스 생성·부착 |
| `setProgress(0~1)` | 스크롤 진행도(관성 추종) |
| `start()` / `stop()` | rAF 루프 |
| `resize()` / `setOptions(p)` / `destroy()` | 크기 반영 / 옵션 변경 / 자원 해제 |

## 주요 옵션

| 옵션 | 기본 | 설명 |
|---|---|---|
| `count` | `19` | 카드 장수 |
| `cardW`/`cardH`/`cardT` | `8.5`/`5.5`/`0.14` | 카드 크기·두께(85:55) |
| `paperColor` | `0x4545da` | 단색/옆면 색 |
| `frontImage` | `null` | 앞면 텍스처 URL |
| `backImages` | `[]` | 뒷면 텍스처 URL 배열(순환) |
| `camZ`/`fov` | `23`/`42` | 카메라 거리·화각 |
| `spreadX` | `0.62` | 좌우 분산 폭 |
| `spin` | `3.0` | 회전량(rad) |
| `rise` | `4.2` | 상승량 |
| `climax` | `true` | 0번 카드를 클라이맥스로 |
| `shadow` | `null` | `null`=자동(!lowPower) |
| `lowPower` | `null` | `null`=자동(`window.QNB.device`) / 강제 |
| `pauseWhenHidden` | `true` | 화면 밖이면 루프 정지 |

## 동작 원리 / 성능

- 카드는 시작 시 깊이축(z)에 분산 + 랜덤 회전 상태. `prog 0→1`에 따라 `baseY + prog*rise`로 상승, `spin*prog`로 텀블.
- 좁은(모바일) 화면에선 좌우 분산을 자동 축소해 카드가 화면 안에 모인다.
- 저사양에선 `MeshLambertMaterial`·그림자 off·pixelRatio 강등(`lowPower`).
- `destroy()`로 텍스처·머티리얼·지오메트리·렌더러를 모두 해제.

## 메모

- 원본은 명함 앞/뒤가 브랜드 이미지였다. 데모는 placeholder 텍스처를 동봉했으니 실제 카드 이미지로 교체하면 된다.
- 클라이맥스 카드(0번)를 푸터 전환과 동기화하던 로직은 제거했다 — 필요하면 `cards[0].mesh`를 직접 투영해 페이지 측에서 커튼을 구현하라(원본 참고).
