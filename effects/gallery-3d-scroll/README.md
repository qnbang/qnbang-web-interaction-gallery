# Gallery 3D Scroll — Dolly (`gallery-3d-scroll`)

스크롤로 카메라가 Z축을 **돌리인(dolly-in)**하며, 공간에 흩뿌려진 이미지 카드 필드를 통과해 비행하는 3D 갤러리. 뒤의 카드는 작고 흐리게 떠 있다가 다가오면 커지고 또렷해지며, 카메라를 스쳐 지나며 디졸브한다. 카드는 종이처럼 굽이치고(정점 셰이더) 모서리에 라운드 마스크(프래그먼트 SDF)가 적용된다.

> framework: vanilla · entry `gallery-3d-scroll.js` · export `GalleryDolly` · 의존 `three`
> 출처: 큐앤뱅 리믹스6 갤러리 섹션에서 추출(`window.QNB` 의존은 `lowPower` 옵션으로 일반화).

## 의존성 / 설치

```html
<script type="importmap">
  { "imports": { "three": "../../shared/vendor/three.module.min.js" } }
</script>
<div id="stage" style="position:fixed;inset:0"></div>
<script type="module">
  import { GalleryDolly } from './gallery-3d-scroll.js';
  const images = ['/img/1.jpg', '/img/2.jpg', /* ... */];
  const gallery = new GalleryDolly('#stage', { images, minPlanes: 18, cornerRadius: 0.06 });

  // 스크롤 → 진행도(0~1) 연결
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    gallery.setProgress(max > 0 ? scrollY / max : 0);
  }, { passive: true });
</script>
```

`setProgress`는 어떤 스크롤 소스든 연결 가능 — 네이티브 스크롤, Lenis, ScrollTrigger의 `onUpdate(self => gallery.setProgress(self.progress))` 등.

## API

| 멤버 | 설명 |
|---|---|
| `new GalleryDolly(container, { images, ... })` | `images` 필수 |
| `setProgress(0~1)` | 스크롤 진행도(카메라 목표 z) |
| `start()` / `stop()` | rAF 루프 |
| `resize()` | 컨테이너 크기 반영 |
| `setOptions(partial)` | 런타임 파라미터 |
| `destroy()` | 텍스처·지오·렌더러·이벤트 해제 |
| `onFocus = (index) => {}` | 초점 카드 변경 콜백 |

## 주요 옵션

| 옵션 | 기본 | 설명 |
|---|---|---|
| `images` | `[]` | **필수**. 이미지 URL 배열 |
| `minPlanes` | `15` | 화면을 채울 최소 카드 수(부족하면 순환 복제) |
| `gapZ` | `3.2` | 카드 Z 간격(작을수록 빽빽) |
| `planeH` / `aspect` | `1.45` / `4:3` | 카드 기본 크기·비율 |
| `scaleMin`–`scaleMax` | `0.5`–`1.08` | 카드별 크기 강약 |
| `xSpread` / `ySpread` | `2.3` / `1.55` | 좌우·상하 산포 |
| `cornerRadius` | `0` | 둥근 모서리(0=직각) |
| `focusDist` / `fadeSpan` / `passFade` | `4.5` / `9` / `2.2` | 초점·페이드인·디졸브 |
| `parallax` | `0.5` | 마우스 미세 시차(0=끔) |
| `transparent` / `void` / `fog` | `true` / `#0a0a0a` / `[6,20]` | 투명 캔버스·안개 |
| `lowPower` | `null` | `null`=자동(`window.QNB.device` 있으면 사용) / `true`·`false` 강제 |
| `pauseWhenHidden` | `true` | 화면 밖이면 루프 정지 |

## 동작 원리 / 성능

- 카드 위치는 **저불일치(irrational) 수열**로 결정적·고르게 산포(연속 카드가 겹쳐 깜빡이지 않음).
- 스크롤 속도가 셰이더 `uVel`을 구동 → 종이 펄럭임. 멈추면 0(평평)이라 잔상·모션블러 없음(어지러움 방지).
- 같은 URL 텍스처는 1회만 로드해 공유. 화면 밖이면 IntersectionObserver로 루프 정지.
- 저사양에선 antialias off·pixelRatio·면분할을 자동 강등(`lowPower`).
