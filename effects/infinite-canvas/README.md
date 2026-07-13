# Infinite Canvas (`infinite-canvas`)

휠·드래그·터치로 **끝없이 패닝**되는 무한 타일 이미지 그리드. 이미지 그리드를 2×2로 복제 배치하고, 위치가 절반 폭/높이마다 wrap되어 어디로 끌어도 끊김 없이 이어진다(Figma식 무한 캔버스).

> framework: react · entry `infinite-canvas.tsx` · export `InfiniteCanvas` · 의존 `gsap`

## 출처 / 라이선스

[skiper-ui.com /v1/skiper73](https://skiper-ui.com/v1/skiper73) "Infinite canvas" 충실 포팅. **Skiper UI (free) — 자유 사용·수정 가능하나 출처표기(attribution) 필수.** 메커니즘·이징·수치 원본 그대로.

## 의존성

```bash
npm i react gsap   # GSAP Observer 는 gsap 패키지에 포함(gsap/Observer)
```

## 사용

```tsx
"use client";
import { InfiniteCanvas } from "@/components/infinite-canvas";

export default function Page() {
  return (
    <div className="h-screen w-full">
      <InfiniteCanvas
        numberOfImages={15}
        imageRootPath="/images/board"   {/* /images/board/img1.png … img15.png */}
        imageClassName="w-[25vw] lg:w-[15vw]"
        gap="10vw"
      />
    </div>
  );
}
```

데모로 바로 보려면 `InfiniteCanvasDemo` (이미지는 `assets/`의 placeholder).

## Props

| prop | 기본 | 설명 |
|---|---|---|
| `numberOfImages` | `15` | `imageRootPath/img1.png … imgN.png` |
| `imageRootPath` | `'/images/lummi'` | 이미지 루트 경로 |
| `imageClassName` | `'w-[25vw] lg:w-[15vw]'` | 이미지 셀 크기 |
| `gap` | `'10vw'` | 셀 간격 |
| `className` | — | 루트 섹션 추가 클래스 |

## 동작 원리 / 메모

- **무한 wrap**: `gsap.utils.wrap(-half, 0)` + `unitize` 모디파이어로 누적 이동량을 절반 크기 안으로 되돌려, 2×2 복제된 그리드가 매끄럽게 반복.
- **입력**: `Observer.create({ target: window, type: "wheel,touch,pointer" })`. 휠은 delta를 빼고(자연 스크롤), 드래그는 2배로 더해 패닝. `quickTo(duration 1.5, ease power4)`로 관성 추종.
- 캔버스 자체는 `pointer-events-none` — 입력은 window 레벨 Observer가 받으므로 화면 어디서 끌어도 패닝된다.
- 이미지는 `img1.png … imgN.png` 규칙. 다른 이름을 쓰려면 컴포넌트의 파일명 생성부를 수정.
