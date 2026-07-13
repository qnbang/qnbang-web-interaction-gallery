# Scroll Images Reveal — Perspective (`scroll-images-reveal`)

2열 그리드의 이미지 카드들이 스크롤에 따라 **3D 원근 변형**으로 리빌되는 효과. 각 카드가 `rotateX(70→0→-50)`·`rotateZ`·`skewX`·`scaleY(1.8→1→1.1)`·`blur/brightness/contrast`로 움직이고, 좌/우 열이 미러링되어 가운데로 모였다 멀어지는 깊이감을 만든다.

> framework: react · entry `scroll-images-reveal.tsx` · export `ScrollImagesReveal` · 의존 `framer-motion`

## 출처 / 라이선스

[skiper-ui.com /v1/skiper33](https://skiper-ui.com/v1/skiper33) "Scroll images reveal 002"의 **Framer Motion 변형** 충실 포팅. **Skiper UI (free) — 자유 사용·수정 가능하나 출처표기(attribution) 필수.** 스크롤 transform·구간·수치 원본 그대로. (원본은 GSAP ScrollTrigger 변형도 함께 제공.)

## 의존성

```bash
npm i react framer-motion
# (선택) 매끈한 스크롤: npm i lenis
```

## 사용

```tsx
"use client";
import { ScrollImagesReveal } from "@/components/scroll-images-reveal";

const images = ["/img/1.webp", "/img/2.webp", /* ... */];

export default function Page() {
  return <ScrollImagesReveal images={images} />;
}
```

데모로 바로 보려면 `ScrollImagesRevealDemo` (이미지는 `assets/`의 placeholder).

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `images` | — | **필수** 이미지 URL 배열 |
| `caption` | `'Perspective scroll effect'` | 상단 캡션(빈 문자열이면 숨김) |
| `className` | `''` | 루트 추가 클래스 |

## 동작 / 메모

- 각 카드는 `useScroll({ target, offset: ["start end","end start"] })`로 자신의 진행도를 얻어 `useTransform`으로 변형. `filter`는 멀티 입력 `useTransform([blur,brightness,contrast], …)`로 합성.
- 카드 컨테이너에 `perspective: 800px`. 좌/우(`index%2`)가 x·rotateZ·skewX 부호를 반전해 미러링.
- 그리드는 `max-w-sm grid-cols-2 gap-8`, 위아래 `20vh` 패딩으로 스크롤 여유 확보. 입력 이미지 앞 4장을 한 번 더 이어 풍성하게(원본 동일).
- 스무스 스크롤(Lenis/Locomotive)과 함께 쓰면 변형 전환이 더 부드럽다(원본도 Lenis 사용).
