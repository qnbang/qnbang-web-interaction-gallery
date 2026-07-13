# Smooth Cursor

점 **하나**가 마우스를 살짝 딜레이로 따라오고, 빠르게/멀리 움직이면 진행 방향으로 늘어났다 줄어든다(squish/stretch + 회전). `cursor-target` 버튼에 닿으면 점이 **그 자리에서 버튼 모양·크기로 퍼져 채움이 되고**(점이 0으로 줄며 동시에 채움이 0→1로 자람 = 점→채움 변형, 흡수/사라짐 아님), 채운 채로 포인터를 따라 morph하며 쫀득하게 움직인다. 벗어나면 다시 점으로 돌아온다.

> [makepill.com](https://makepill.com)의 `Cursor.js` 번들을 **직접 내려받아 onTick·magnetize 알고리즘을 추출**해 의존성 없이 재구현했다(원본 코드 미사용).
> 원본은 점(원)을 버튼 크기로 transform-scale해 채우는데, 그 방식은 **정원에서만 모양이 맞고(비정원=타원), 작은 점을 확대해 화질이 깨진다**. 그래서 여기선 채움을 별도 레이어(`fillEl`)로 두고 **버튼의 크기·`border-radius`를 그대로 그려** 어떤 모양이든 정확하고(원본 크기 렌더라) 선명하게 만든다 — 동작 느낌(점이 퍼져 채우고 따라옴)은 동일.

## 사용법

```html
<script type="module">
  import { SmoothCursor } from './smooth-cursor.js';
  const cursor = new SmoothCursor();                 // 문서 전체(body)
  // const cursor = new SmoothCursor({ color: '#deff00', mainSpeed: 12 });
</script>
```

```html
<a href="/reel" data-cursor-text="자세히 →">Showreel</a>  <!-- hover 시 점이 커지고 라벨 표시 -->
<a href="#" class="cursor-target">Work</a>                <!-- 닿으면 점이 이 요소 크기로 퍼져 채움 -->
<section data-cursor-theme="green"> … </section>           <!-- 이 영역 위에선 green 테마 색 -->
```

`cursor-target` 채움이 텍스트를 가리지 않으려면, 짝 효과 [`cursor-target`](../cursor-target/)가 hover 시 버튼을 커서보다 위(z-index)로 올린다. 함께 쓰는 것을 권장.

## 옵션 (`DEFAULTS`)

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `size` | `14` | 점 지름(px) — 원본과 동일 |
| `color` / `textColor` | `#fff` / `#0f0f0f` | 점 색 / 라벨 글자색 |
| `mainSpeed` | `10` | 위치 lerp 속도(×dt) — 원본 10. 클수록 딜레이↓ |
| `scaleSpeed` | `7` | 확대/축소 lerp 속도 — 원본 7 |
| `morphLevel` / `morphLevelHover` | `0.008` / `0.002` | 속도→늘어남 강도(평소/타깃) — 원본값 |
| `morphMax` | `1.3` | 늘어남 상한 — 원본 1.3 |
| `fillSelector` | `.cursor-target, [data-cursor-fill]` | 닿으면 점이 이 요소 크기로 퍼져 채움(useElementSize) |
| `fillColor` | `null` | 채울 때 점 색(null이면 `color` 유지) |
| `labelSelector` | `[data-cursor-text], [data-cursor-icon]` | hover 시 점이 커지고 라벨 표시 |
| `labelAttr` / `iconAttr` | `data-cursor-text` / `-icon` | 라벨·아이콘 속성 |
| `hoverScale` | `3` | 라벨 타깃 확대 배율 |
| `themeAttr` / `themes` | `data-cursor-theme` / white·dark·green | 테마 전환 |
| `blendDifference` | `false` | `mix-blend-mode: difference` |
| `hideNative` | `true` | OS 커서 숨김 |
| `zIndex` | `9000` | 커서 레이어 z-index (cursor-target의 raiseZ보다 작아야 함) |
| `respectReducedMotion` | `true` | 모션 최소화면 morph 끄고 즉시 추종 |

## API
`start()` · `stop()` · `setTheme(name)` · `setOptions(partial)` · `destroy()`(필수 정리). 자석 동기화용으로 `cursor.currentCursorPosition`(보간된 현재 위치)을 노출.

## 동작 원리 (원본 onTick·magnetize 그대로)

매 프레임(`dt` = 델타타임):
```
pos      = lerp(pos, pointer, 10*dt)              // 점이 살짝 딜레이로 추종
velocity = pointer - pos
morphX   = min(1 + |v|*morphLevel, 1.3)           // 속도로 늘어남
morphY   = max(1 - |v|*morphLevel*0.25, 0.5)      // 수직으로 눌림
dotScale  = lerp(dotScale,  dotTarget,  7*dt)      // 둥근 점 표시량(기본 1)
fillScale = lerp(fillScale, fillTarget, 7*dt)      // 채움 표시량(기본 0)
angle     = atan2(v.y, v.x)                         // 진행 방향으로 회전
dot.transform  = rotate(angle) scale(dotScale*morphX,  dotScale*morphY)
fill.transform = rotate(angle) scale(fillScale*morphX, fillScale*morphY)
```
- 평소: `dotTarget=1, fillTarget=0`(점만), `morphLevel=0.008`.
- `fillSelector` 진입 시: 채움 레이어(`fillEl`)를 그 요소의 크기·`border-radius`로 설정 → `dotTarget=0, fillTarget=1` → **점이 0으로 줄며 동시에 채움이 0→1로 자라** 닿은 지점에서 퍼진다(점→채움 변형). 채움은 원본 크기로 그려져 **선명**하고 모양이 **정확**하며, 채운 채 포인터를 따라 morph(쫀득).
- 채움 중 morph는 **원본 상수 그대로**(`morphLevel=0.002`, 상한 `1.3`). 이동 방향의 gap(=`pointer−lerped pos`)이 클수록 늘어나고 멈추면 1로 복귀.
- **원형 채움 vs 비정원 채움 (스쿼시 차이, 원리적 한계)**:
  - 정원(정사각+완전 라운드)은 회전 대칭이라 진행 방향으로 회전시켜도 모양이 안 변한다 → 둥근 점과 동일하게 `rotate(angle)` + 방향 스쿼시(`scale(morphX, morphY)`)로 **이동 방향으로 늘어나는 쫀득함**(원본과 동일).
  - 알약·사각은 회전 대칭이 아니라 진행각으로 회전시키면 도형이 "박힌다" → **회전 없이 축 정렬**로 이동 방향의 x/y 성분만 반영. 원만큼 강한 방향 스쿼시는 원리적으로 불가(회전을 못 쓰기 때문).
- 점·채움 모두 `transform`만 갱신(레이아웃 비용 0).

## 성능 / 접근성
- `(hover:hover) and (pointer:fine)` 아니면 초기화 안 함(터치=네이티브 커서). `prefers-reduced-motion`이면 morph off·즉시 추종.
- 리스너는 `window`/`document`에만, `destroy()`로 전부 해제.

## 페어링
[`cursor-target`](../cursor-target/)와 함께 쓰면 점이 퍼져 버튼을 채우고(채움은 커서), 버튼은 위로 올라와 텍스트가 채움 위에 보이며 링이 수축하고 내용이 자석으로 따라오는 makepill식 버튼이 완성된다.
