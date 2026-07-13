# Cursor Target

속 빈(hollow) 버튼에 닿으면, 짝 효과 [`smooth-cursor`](../smooth-cursor/)의 점이 **그 자리에서 이 버튼의 모양·크기로 퍼져 채운다**(점→채움 변형). 이 효과는 그때 버튼을 **커서 위로 올려(z-index)** 텍스트가 채움 위에 보이게 하고, 둘레 링(`::after`)을 `scale3d(0,0,1)`로 수축시키며 글자색을 `primary`로 바꾸고, 안쪽 라벨을 커서를 향해 자석처럼 끌어당긴다.

> [makepill.com](https://makepill.com)의 `CursorTarget`을 의존성 없이 재구현했다(원본 코드 미사용).
> **채움은 이 효과가 아니라 커서가 그린다.** 커서가 `--ct-fill`(이 효과가 세팅) 색과 버튼의 크기·`border-radius`를 읽어, 어떤 모양이든(원/알약/사각) 정확하고 선명하게 채운다.

## 사용법

```html
<script type="module">
  import { SmoothCursor } from '../smooth-cursor/smooth-cursor.js';
  import { CursorTarget } from './cursor-target.js';
  const cursor = new SmoothCursor({ color: '#ffffff' });                 // 점이 채움으로 변형
  const ct = new CursorTarget(document, { fill: '#ffffff', primary: '#0f0f0f', cursor });
</script>
```

- 대상 버튼은 **배경 투명**이어야 커서 채움이 비쳐 보인다(속 빈 상태).
- 버튼에 `border-radius`를 주면 채움이 그 모양을 그대로 따른다.
- `cursor`에 `SmoothCursor` 인스턴스를 주면 라벨 자석이 커서 보간 위치에 동기화된다(없으면 원시 포인터).
- **반드시 `smooth-cursor`와 함께** — 채움이 커서에서 나오기 때문. 단독 사용 시 링 수축·글자색·라벨 자석만(채움 없음).

## 옵션 (`DEFAULTS`)

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `targets` | `'a, button, [data-cursor-target]'` | 적용 대상 셀렉터 |
| `fill` | `#ffffff` | 채움색(`--ct-fill`로 노출 → 커서가 사용) |
| `primary` | `#0f0f0f` | hover 시 글자색 |
| `ring` / `ringWidth` | `rgba(255,255,255,.3)` / `1px` | 평소 hollow 링 색·두께 |
| `strength` / `disabledStrength` | `0.75` / `0.35` | 라벨 자석 당김 비율 — 원본값 |
| `lerpSpeed` | `5` | 라벨 자석 lerp 속도(×dt) — 원본 5 |
| `raiseZ` | `9001` | hover 시 z-index (커서 `zIndex`보다 커야 텍스트가 채움 위) |
| `cursor` | `null` | SmoothCursor 인스턴스(자석 위치 동기화) |
| `magnetic` | `true` | 라벨 자석 사용 |

## API
`refresh()` · `add(el)` · `start()` · `stop()` · `destroy()`(클래스·래퍼·z-index 원복, 필수 정리)

## 동작 원리

- **채움(fill)**: 이 효과는 그리지 않는다. 버튼에 `--ct-fill` 색을 세팅하고, hover 시 `z-index: raiseZ`로 버튼을 **커서 위로** 올린다 → 배경 투명한 버튼 너머로 커서 채움이 보이되 텍스트는 그 위에. (커서가 버튼 크기·`border-radius`로 정확·선명하게 채움)
- **링 수축**: `::after` 링이 `scale3d(1,1,1)→scale3d(0,0,1)`, 이징 `cubic-bezier(0.19,1,0.22,1)`.
- **라벨 자석**: 매 프레임 `target=(커서−버튼중심)×strength`, `cur += (target−cur)·clamp(5·dt,0,1)` → `.ct-magnetic`에 `translate3d`. 벗어나면 0 복귀.
- **글자색**: hover 중 `color → primary`(0.15s).

## 성능 / 접근성
- 링·글자색은 CSS 전환, 자석은 hover 중인 요소만 `getBoundingClientRect` + `transform`.
- `(hover:hover) and (pointer:fine)` 아니면 자석 비활성(터치=평범한 버튼).

## 페어링
[`smooth-cursor`](../smooth-cursor/) 필수. 함께 쓰면 점이 닿은 자리에서 버튼 모양대로 퍼져 채우고(흡수 아님), 버튼은 위로 올라와 텍스트가 채움 위에 보이며 링이 수축하고 라벨이 자석으로 따라오는 makepill식 버튼이 완성된다.
