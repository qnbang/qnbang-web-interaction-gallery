# Bouncy Accordion (`bouncy-accordion`)

항목을 펼칠 때 내용이 **탄성(overshoot) 스프링**으로 통통 열리는 아코디언. 단일/다중 펼침을 지원하고 셰브론이 회전한다.

> framework: react · entry `bouncy-accordion.tsx` · export `BouncyAccordion` · 의존 `framer-motion`
> "아코디언" UI 패턴의 독자 구현. 외부 소스 미사용.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { BouncyAccordion, type AccordionItem } from "@/components/bouncy-accordion";

const items: AccordionItem[] = [
  { id: 1, title: "질문 1", content: "답변 내용 (ReactNode)" },
  { id: 2, title: "질문 2", content: <p>커스텀 마크업도 가능</p> },
];

export default function Page() {
  return <BouncyAccordion items={items} />;
}
```

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `items` | — | **필수** `{id,title,content}[]` (content는 ReactNode) |
| `multiple` | `false` | 동시 다중 펼침 |
| `defaultOpen` | `[]` | 초기 펼친 id들 |
| `spring` | `{stiffness:420, damping:24}` | 탄성(작을수록 더 출렁) |
| `className` | `""` | 루트 추가 클래스 |

## 동작 / 메모

- 펼침은 `height: 0 ↔ auto`를 framer-motion 스프링으로 — damping을 낮추면 overshoot(바운스)가 커진다.
- 헤더는 `<button aria-expanded>` — 키보드·스크린리더 접근 가능.
- Tailwind 프로젝트 전제. 색은 `text-black/65` 등 인라인이라 다크 테마는 클래스 조정.
