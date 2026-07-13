# Hover List (`hover-list`)

리스트 항목 hover 인터랙션. 각 항목 위로 커서를 올리면:

- 행 배경이 **왼→오 와이프**로 채워지고
- 항목명(heading)이 우측으로 살짝 **들여쓰기**되며
- 화살표(→)가 좌측에서 **blur→0 디블러**되며 슬라이드-인
- 짧고 부드러운 **'톡' 사운드**(Web Audio 합성 — 오디오 파일 불필요)

> framework: vanilla · entry `hover-list.js` · export `HoverList` · CSS `hover-list.css` 동봉 필수
> 출처: 큐앤뱅 리믹스6 Our Service에서 일반화 추출.

## 설치

1. `hover-list.js` + `hover-list.css`를 함께 복사.
2. CSS를 로드하고, 항목 컨테이너에 `.hl-list`, 각 항목에 `.hl-item`을 부여.

```html
<link rel="stylesheet" href="./hover-list.css" />
<div class="hl-list" id="list">
  <div class="hl-item">Brand Identity</div>
  <div class="hl-item">Web Design</div>
</div>
<script type="module">
  import { HoverList } from './hover-list.js';
  new HoverList('#list');
</script>
```

JS가 각 `.hl-item`의 텍스트를 `.hl-heading`으로 감싸고 `.hl-arrow`를 추가한다(기존 속성·클릭 핸들러는 보존).

## 색 커스터마이즈

`.hl-list`의 CSS 변수만 덮어쓰면 된다:

```css
.hl-list {
  --hl-fill: #ffffff;            /* hover 채움색 */
  --hl-text: rgba(20,20,30,.45); /* 평상시 글자색 */
  --hl-text-hover: #1a1a4a;      /* hover 글자색 */
  --hl-line: rgba(0,0,0,.1);     /* 구분선 */
}
```

## API

| 멤버 | 설명 |
|---|---|
| `new HoverList(root\|selector, options)` | 컨테이너에 부착 |
| `destroy()` | 이벤트·오디오 컨텍스트 해제 |

### 옵션

| 옵션 | 기본 | 설명 |
|---|---|---|
| `itemSelector` | `'.hl-item'` | 항목 선택자 |
| `arrow` | `'→'` | 화살표 글리프 |
| `sound` | `true` | hover blip 사운드 |
| `soundVolume` | `0.05` | 음량(0~1) |
| `desktopOnly` | `true` | `(hover:hover)`에서만 구조 주입·사운드(터치는 CSS만) |

## 메모

- 사운드는 브라우저 자동재생 정책상 **첫 사용자 제스처 이후** 재생.
- 시각 효과는 전부 `transform`/`opacity`/`filter` — 컴포지터 친화적.
- 원본은 bymonolog.com 푸터 네비 동작을 참고해 재현한 것(사운드는 저작 오디오 대신 Web Audio 합성).
