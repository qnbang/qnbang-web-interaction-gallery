# Stairs Preloader (`stairs-preloader`)

화면을 덮은 N개의 세로 컬럼(계단)이 **우→좌 stagger**로 height 0으로 접히며 사라지고, 중앙 헤드라인이 천천히 페이드인했다가 퇴장 시 페이드아웃하는 프리로더.

> framework: react · entry `stairs-preloader.tsx` · export `StairsPreloader` · 의존 `framer-motion`

## 출처 / 라이선스

[skiper-ui.com /v1/skiper9](https://skiper-ui.com/v1/skiper9) "Stairs preloader" 충실 포팅. **Skiper UI (free) — 자유 사용·수정 가능하나 출처표기(attribution) 필수.** 트랜지션·딜레이·이징 원본 그대로.

## 의존성

```bash
npm i react framer-motion
```

## 사용

```tsx
"use client";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { StairsPreloader } from "@/components/stairs-preloader";

export default function Page() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative h-screen">
      <AnimatePresence mode="wait">{loading && <StairsPreloader />}</AnimatePresence>
      {/* 실제 콘텐츠 */}
    </main>
  );
}
```

데모로 바로 보려면 `StairsPreloaderDemo`(`duration` prop, 기본 2500ms)를 렌더.

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `columns` | `5` | 컬럼(계단) 개수 — 각 `100/columns vw` |
| `columnColor` | `'#000'` | 컬럼 색 |
| `headline` | `'The first-ever AGI. Period.'` | 중앙 헤드라인(빈 문자열이면 숨김) |
| `headlineColor` | `'#fff'` | 헤드라인 색 |
| `className` | `''` | 루트 추가 클래스 |

## 동작 / 메모

- 컬럼 퇴장: `height 100%→0`, `delay = 0.4 + 0.05·(N-1-i)`(오른쪽 컬럼부터), `ease [.33,1,.68,1]`, `duration .5`.
- 헤드라인: 진입 `opacity 0→1`(duration 4, 단어별 `delay .2·i`), 퇴장 `opacity→0`(duration .6).
- **반드시 부모의 `<AnimatePresence mode="wait">` 안에서** show 토글로 마운트/언마운트해야 exit 애니메이션이 재생된다.
- 헤드라인 페이드인이 4초로 길어, 2.5초 프리로더에선 의도적으로 "다 차오르기 전에" 걷힌다(원본 동일).
