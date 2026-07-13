# Projects Showcase (`projects-showcase`)

프로젝트명 리스트에 호버하면 그 프로젝트의 **프리뷰 이미지가 커서를 따라 떠오르고**, 활성 행은 살짝 밀려 강조되며 나머지는 흐려진다.

> framework: react · entry `projects-showcase.tsx` · export `ProjectsShowcase` · 의존 `framer-motion`
> "호버 프리뷰 프로젝트 리스트" UI 패턴의 독자 구현. 외부 소스 미사용.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { ProjectsShowcase, type ShowcaseProject } from "@/components/projects-showcase";

const projects: ShowcaseProject[] = [
  { id: 1, title: "Velvet Dreams", meta: "Branding · 2024", image: "/img/1.jpg" },
  // ...
];

export default function Page() {
  return <div className="min-h-screen flex items-center bg-[#0e0e10]"><ProjectsShowcase projects={projects} /></div>;
}
```

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `projects` | — | **필수** `{id,title,meta?,image}[]` |
| `previewSize` | `{w:280,h:200}` | 프리뷰 이미지 크기(px) |
| `background` / `foreground` | `#0e0e10` / `#f4f4f5` | 배경·전경색 |
| `className` | `""` | 루트 추가 클래스 |

## 동작 / 메모

- 프리뷰는 컨테이너 기준 `useSpring` x/y로 커서를 부드럽게 추종(중앙 정렬 `translate -50%`).
- 활성 외 행은 `opacity 0.35`로 흐려져 포커스를 유도.
- 데스크톱 호버 위주(터치 기기엔 프리뷰가 안 뜸). Tailwind 프로젝트 전제.
