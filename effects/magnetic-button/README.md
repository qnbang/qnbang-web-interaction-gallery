# Magnetic Button (`magnetic-button`)

커서를 따라오는 자석 버튼. 작게 웅크렸다 **elastic으로 통통 등장**하고, 떠 있는 동안 **커서를 추종**하며, 누르면 **squish** 후 복귀한다.

> framework: vanilla · entry `magnetic-button.js` · export `MagneticButton`
> 출처: 큐앤뱅 리믹스6 푸터 CTA에서 일반화 추출. 원본 풀 프로젝트: `260613_큐앤뱅-웹사이트리뉴얼/.../리믹스6-재설계`.

## 의존성

```bash
npm i gsap
```

데모는 importmap으로 gsap을 매핑한다(`https://esm.sh/gsap@3.12.5`).

## 사용

```html
<script type="importmap">
  { "imports": { "gsap": "https://esm.sh/gsap@3.12.5" } }
</script>
<script type="module">
  import { MagneticButton } from './magnetic-button.js';
  const btn = new MagneticButton('#cta', { magnet: 0.28 });
  btn.reveal(true);            // 통통 등장
  // 스크롤/근접 등 원하는 트리거에서:  btn.reveal(false) / btn.reveal(true)
</script>
```

원본처럼 **스크롤 영역 진입 시 등장**시키려면 IntersectionObserver나 ScrollTrigger의 콜백에서 `reveal()`을 호출하면 된다.

## API

| 멤버 | 설명 |
|---|---|
| `new MagneticButton(el\|selector, options)` | 버튼에 부착 |
| `reveal(on=true)` | 등장(elastic)/퇴장(페이드) 토글 |
| `hide()` | `reveal(false)` 단축 |
| `setOptions(partial)` | 런타임 옵션 변경 |
| `destroy()` | 이벤트·트윈 해제 |

### 옵션

| 옵션 | 기본 | 설명 |
|---|---|---|
| `magnet` | `0.28` | 커서 추종 강도(0~1) |
| `hiddenScale` | `0.6` | 숨김 상태 scale |
| `showDuration` | `0.7` | 등장 트윈 길이(s) |
| `showEase` | `elastic.out(1, 0.5)` | 등장 이징 |
| `pressScale` | `0.92` | mousedown squish scale |
| `startHidden` | `true` | 마운트 시 숨김으로 시작 |
| `followDuration` | `0.5` | 커서 추종 트윈 길이(s) |

## 동작 원리

- `gsap.quickTo`로 x/y를 부드럽게 추종(매 mousemove마다 목표값만 갱신, 트윈은 gsap이 관리).
- 등장은 `autoAlpha`(opacity+visibility) + `scale`을 elastic으로, 퇴장은 `power2.in`으로.
- 숨김 상태에선 `pointer-events:none`이라 뒤 콘텐츠 클릭을 막지 않는다.

## 성능 / 접근성

- 애니메이트 속성은 `transform`·`opacity`만 — 컴포지터 친화적.
- 마그네틱은 `(hover:hover)` 데스크톱에서만 의미 있음(터치 기기에선 `reveal`만 사용 권장).
