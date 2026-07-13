# Gooey Menu (`gooey-menu`)

토글 버튼을 누르면 하위 액션 버튼들이 **끈적하게(gooey) 갈라지며 퍼지는** 플로팅 메뉴. 가까운 둥근 버튼들이 SVG 필터로 액체처럼 이어졌다 떨어진다.

> framework: react · entry `gooey-menu.tsx` · export `GooeyMenu` · 의존 `framer-motion`
> "gooey 메뉴" UI 패턴의 독자 구현(표준 SVG goo 필터 기법). 외부 소스 미사용.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { GooeyMenu, type GooeyItem } from "@/components/gooey-menu";

const items: GooeyItem[] = [
  { id: "heart", icon: <HeartIcon />, onSelect: () => {} },
  { id: "star",  icon: <StarIcon /> },
  { id: "plus",  icon: <PlusIcon /> },
];

export default function Page() {
  return <div className="grid place-items-center min-h-screen"><GooeyMenu items={items} direction="up" /></div>;
}
```

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `items` | — | **필수** `{id,icon,label?,onSelect?}[]` |
| `direction` | `"up"` | `up`/`down`/`left`/`right`/`radial` |
| `gap` | `64` | 버튼 간 간격(px) |
| `size` | `56` | 버튼 지름(px) |
| `color` / `iconColor` | `#ef4444` / `#fff` | 버튼·아이콘 색 |
| `className` | `""` | 래퍼 추가 클래스 |

## 동작 원리 / 메모

- **goo 필터**: `feGaussianBlur(stdDeviation 6)`로 번지게 한 뒤 `feColorMatrix`의 알파 행 `0 0 0 20 -9`로 대비를 키워, 흐릿한 가장자리가 다시 또렷해지며 가까운 블롭이 합쳐 보인다.
- 자식 버튼은 메인 버튼 위치에서 `direction` 오프셋으로 spring 전개(stagger), 메인 아이콘은 +↔× 로 135° 회전.
- 필터 id는 `useId`로 인스턴스마다 고유(다중 사용 충돌 방지).
- goo 필터는 요소가 **불투명 배경/단색**일 때 가장 깔끔하다(반투명·이미지 자식은 효과가 약함).
