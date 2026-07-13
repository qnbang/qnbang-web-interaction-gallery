# Expand Panels (`expand-panels`)

호버(데스크톱)/탭(모바일)로 한 패널이 펼쳐지며 이미지가 드러나는 패널 갤러리. 펼친 패널은 라벨이 밝아지고 보조 메타(연도 등)가 페이드인하며, 접힌 패널은 라벨을 세로로 표시한다.

> framework: react · entry `expand-panels.tsx` · export `ExpandPanels` · 의존 `framer-motion`
> "확장 패널 갤러리" UI 패턴의 독자 구현(flex-grow layout animation). 외부 소스 미사용.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { ExpandPanels, type PanelItem } from "@/components/expand-panels";

const items: PanelItem[] = [
  { id: 1, label: "Velvet Dreams", meta: "2024", image: "/img/1.jpg" },
  { id: 2, label: "Neon Pulse",    meta: "2024", image: "/img/2.jpg" },
  // ...
];

export default function Page() {
  return <div className="h-screen"><ExpandPanels items={items} /></div>;
}
```

데모로 바로 보려면 `ExpandPanelsDemo` (이미지는 `assets/`의 placeholder).

## Props

| prop | 타입 | 기본 | 설명 |
|---|---|---|---|
| `items` | `{id,label,meta?,image}[]` | — | **필수** |
| `className` | `string` | `""` | 루트 추가 클래스 |
| `defaultActive` | `number` | `0` | 초기 활성 인덱스 |
| `activeGrow` | `number` | `6` | 펼친 패널 flex-grow |
| `collapsedGrow` | `number` | `1` | 접힌 패널 flex-grow |
| `mobileBreakpoint` | `number` | `768` | 모바일 분기(px) |
| `background` / `foreground` | `string` | `#0e0e10`/`#f4f4f5` | 배경·전경색 |

## 동작 / 메모

- 데스크톱은 hover, 모바일은 tap으로 활성 전환(`useIsMobile` 내장).
- 펼침은 framer-motion `layout` + spring, 이미지는 opacity/scale 페이드.
- 세로 라벨은 CSS `writing-mode: vertical-rl`. Tailwind 프로젝트 전제.
