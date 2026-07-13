# Hover Members (`hover-members`)

아바타 행에 호버하면 아바타가 커지고, 따라다니는 커스텀 커서가 뜨며, 뒤의 거대한 텍스트가 기본 이름 ↔ 호버한 멤버 이름으로 **글자별 슬라이드 스왑**된다.

> framework: react · entry `hover-members.tsx` · export `HoverMembers` · 의존 `framer-motion`
> "팀 멤버 호버" UI 패턴의 독자 구현. 외부 소스 미사용.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { HoverMembers, type Member } from "@/components/hover-members";

const members: Member[] = [
  { name: "Faffa", image: "/team/1.jpg" },
  { name: "Kaint", image: "/team/2.jpg" },
  // ...
];

export default function Page() {
  return <div className="h-screen"><HoverMembers members={members} defaultName="TEAM" /></div>;
}
```

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `members` | — | **필수** `{name,image}[]` |
| `defaultName` | `"TEAM"` | 호버 전 배경 텍스트 |
| `background` | `#0e0e10` | 배경색 |
| `idleColor` / `activeColor` | `#f4f4f5` / `#ef4444` | 기본/호버 이름 색 |
| `cursorColor` | `#ef4444` | 커서 색 |
| `avatarSize` / `avatarHoverSize` | `60` / `116` | 아바타 기본/확대 px |

## 동작 / 메모

- 커서는 `useSpring` x/y로 부드럽게 추종, 영역 진입 시 scale 0→1.
- 이름 스왑은 `AnimatePresence mode="popLayout"` + 글자별 `overflow:hidden` 슬라이드(중앙 기준 stagger).
- 대형 텍스트는 `text-[26vw]` — 폰트는 프로젝트의 기본 산세리프를 따른다(원하면 컨테이너에 폰트 클래스 지정).
- Tailwind 프로젝트 전제. 터치 기기에선 호버가 없으므로 데스크톱 인터랙션 위주.
