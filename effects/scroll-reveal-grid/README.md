# Scroll Reveal Grid (`scroll-reveal-grid`)

카드들이 스크롤로 뷰포트에 들어올 때 아래에서 떠오르며 **stagger**로 순차 등장하는 반응형 그리드. 한 번 나타나면 유지하고(`once`), `prefers-reduced-motion`이면 즉시 표시한다.

> framework: react · entry `scroll-reveal-grid.tsx` · export `ScrollRevealGrid` · 의존 `framer-motion`
> "스크롤 리빌 그리드" UI 패턴의 독자 구현. 외부 소스 미사용.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { ScrollRevealGrid, type GridCard } from "@/components/scroll-reveal-grid";

const cards: GridCard[] = [
  { id: 1, title: "Velvet", subtitle: "2024", image: "/img/1.jpg" },
  // ...
];

export default function Page() {
  return <div className="max-w-5xl mx-auto px-6 py-40"><ScrollRevealGrid cards={cards} columns={3} /></div>;
}
```

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `cards` | — | **필수** `{id,title?,subtitle?,image}[]` |
| `columns` | `3` | 열 수 |
| `rise` | `48` | 카드 진입 거리(px) |
| `stagger` | `0.08` | 카드 간 시차(s) |
| `className` | `""` | 그리드 추가 클래스 |

## 동작 / 메모

- `whileInView` + `viewport={{ once:true, amount:0.2 }}`로 진입 감지, 컨테이너 `staggerChildren`으로 순차 등장.
- 카드 hover 시 이미지 살짝 확대(`group-hover:scale-105`).
- `useReducedMotion`이면 모션 제거. Tailwind 프로젝트 전제.
