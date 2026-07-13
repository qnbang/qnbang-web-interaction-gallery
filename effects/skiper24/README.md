# Tik Tik Color List (`skiper24`)

스크롤 구동 컬러 리스트. 스크롤하면 항목이 차례로 활성화되며:

- 활성 항목만 불투명(opacity 1), 나머지는 0.2로 페이드
- 페이지 배경이 활성 항목의 `bgColor`로 0.5s 애니메이션(framer-motion)
- 우하단 **드래그 가능한** 프리뷰 카드가 활성 항목 이미지로 스왑
- 항목 전환 시 `tick` 사운드(use-sound)
- 무한 스크롤(원본 N개를 10세트 반복 + 바닥 근처서 5세트씩 추가)

> **framework: react** · 진입점 `skiper24.tsx` · 주 export `TikTikColorList`
> 출처: skiper-ui.com `/v1/skiper24`를 clonecraft 경로1로 이식. 원본 풀 프로젝트: [`clones/_완료/skiper24/`](../../clones/_완료/skiper24/).

## 의존성

```bash
npm i react framer-motion gsap use-sound clsx tailwind-merge
```

Tailwind 프로젝트 전제. PP-MORI 타이포가 원본과 일치하려면 폰트 등록이 필요(아래).

## 설치

1. `skiper24.tsx`를 프로젝트에 복사(예: `components/skiper24.tsx`).
2. **에셋 배치** — 이 효과 폴더의 `assets/`를 소비측 `public/`으로 복사:
   - `assets/images/x.com/*.jpeg` → `public/images/x.com/`  (데모 데이터가 참조)
   - `assets/sfx/tick.wav` → `public/sfx/tick.wav`  (`soundSrc` 기본 경로)
   - `assets/fonts/PPMori-Regular.woff` → `public/fonts/PPMori-Regular.woff`
3. **폰트 + Tailwind 등록** — `globals.css`:
   ```css
   @font-face {
     font-family: "PP-MORI";
     src: url("/fonts/PPMori-Regular.woff") format("woff");
     font-weight: 400; font-style: normal; font-display: swap;
   }
   ```
   `tailwind.config`:
   ```ts
   theme: { extend: { fontFamily: { "pp-mori": ["PP-MORI", "sans-serif"] } } }
   ```

## 사용 예

```tsx
"use client";
import { TikTikColorList, type Project } from "@/components/skiper24";

const projects: Project[] = [
  { id: 0, name: "Aarzoo", description: "...", badge: "Print Design", bgColor: "#ff0000", image: "/images/x.com/20.jpeg" },
  { id: 1, name: "Lost Horizons", description: "...", badge: "Concept Art", bgColor: "#fff", image: "/images/x.com/21.jpeg" },
  // ...
];

export default function Page() {
  return (
    <main className="h-screen w-full">
      <TikTikColorList
        projects={projects}
        showPreview
        previewSize="lg"
        enableSound
        infiniteScroll
        scrollThreshold={1000}
      />
    </main>
  );
}
```

원본 12개 데모 데이터를 그대로 쓰려면 `Skiper24`(또는 `demoProjects`)를 import:

```tsx
import { Skiper24 } from "@/components/skiper24";
// <Skiper24 />  ← 원본과 동일
```

## Props

| prop | 타입 | 기본 | 설명 |
|---|---|---|---|
| `projects` | `Project[]` | — | **필수**. 항목 데이터 |
| `className` | `string` | `""` | 루트 컨테이너 추가 클래스 |
| `showPreview` | `boolean` | `true` | 우하단 드래그 프리뷰 카드 |
| `previewSize` | `"sm"\|"md"\|"lg"` | `"lg"` | 프리뷰 크기(200/300/400px) |
| `enableSound` | `boolean` | `true` | 항목 전환 시 tick 사운드 |
| `soundSrc` | `string` | `"/sfx/tick.wav"` | 사운드 파일 경로 |
| `infiniteScroll` | `boolean` | `true` | 리스트 반복 + 바닥 근처 추가 로드 |
| `scrollThreshold` | `number` | `1000` | 추가 로드 임계(px) |

### `Project` 타입

```ts
type Project = {
  id: number;
  name: string;
  description: string;
  badge: string;
  bgColor: string;  // 활성 시 페이지 배경색
  image: string;    // 프리뷰 이미지 경로
};
```

## 동작 원리

- 각 항목에 **GSAP ScrollTrigger**(`start: "top 70%"`)를 걸어, 항목 상단이 뷰포트 70%선을 지날 때 `onEnter`/`onEnterBack`으로 활성 인덱스를 갱신.
- 활성 인덱스(mod)로 `bgColor`·프리뷰 `image`를 결정 → `motion.div`가 배경색을 0.5s `easeInOut`로 트윈.
- 무한 스크롤: 마운트 시 원본을 10세트 펼치고, `scroll` 리스너가 바닥 `scrollThreshold`px 이내면 5세트씩 append.
- 정리: 의존 변경/언마운트 시 `ScrollTrigger.getAll().kill()`로 누수 방지.

## 성능 / 접근성 메모

- 애니메이트 속성은 `opacity`·`backgroundColor`·transform(드래그) — 컴포지터 친화적.
- 사운드는 브라우저 자동재생 정책상 **첫 사용자 상호작용 이후** 재생됨.
- 긴 리스트가 계속 누적되므로(무한 스크롤) 매우 긴 세션에서는 DOM 노드가 증가. 필요 시 `infiniteScroll={false}`로 고정 길이 사용.
- `prefers-reduced-motion`은 미구현(원본 동작 유지). 적용하려면 ScrollTrigger 트윈을 매치미디어로 가드.

## 라이선스 메모

- 컴포넌트 코드: skiper-ui 공개 컴포넌트 이식.
- **PP-MORI 폰트**: Pangram Pangram 상용 폰트. 데모 충실도용으로 동봉했으나 **실배포 시 라이선스 확인** 필요.
- 데모 이미지(`x.com/*.jpeg`): 원본 데모 에셋. 실제 서비스엔 자체 이미지로 교체 권장.
