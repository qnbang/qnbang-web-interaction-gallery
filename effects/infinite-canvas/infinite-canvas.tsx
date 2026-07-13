"use client";

/**
 * InfiniteCanvas — 휠·드래그·터치로 끝없이 패닝되는 무한 타일 이미지 그리드.
 *
 *  - 이미지 그리드(grid-cols-5)를 2×2로 복제 배치(원본 1 + aria-hidden 복제 3)해 seamless 하게 이어붙인다.
 *  - GSAP Observer(window, wheel/touch/pointer)로 누적 이동량을 받아 quickTo(duration 1.5, ease power4)로 부드럽게 추종.
 *  - gsap.utils.wrap(-half, 0) + unitize 모디파이어로 위치가 절반 폭/높이마다 wrap → 무한 반복.
 *  - 휠은 deltaX/Y 를 빼고(자연 스크롤 방향), 드래그는 2배로 더해 패닝.
 *
 * Skiper UI skiper73 (https://skiper-ui.com/v1/skiper73 "Infinite canvas") 충실 포팅
 * — free 라이선스(자유 사용·수정, 출처표기 필수). 메커니즘·이징·수치 원본 그대로.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";

export type InfiniteCanvasProps = {
  /** 이미지 셀 크기 클래스 (default "w-[25vw] lg:w-[15vw]") */
  imageClassName?: string;
  /** 이미지 개수 (imageRootPath/img1.png … imgN.png) */
  numberOfImages?: number;
  /** 이미지 루트 경로 (default "/images/lummi") */
  imageRootPath?: string;
  /** 셀 간격 (default "10vw") */
  gap?: string;
  className?: string;
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const InfiniteCanvas = ({
  imageClassName = "w-[25vw] lg:w-[15vw]",
  numberOfImages = 15,
  imageRootPath = "/images/lummi",
  gap = "10vw",
  className,
}: InfiniteCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    gsap.registerPlugin(Observer);

    const halfW = el.clientWidth / 2;
    const wrapX = gsap.utils.wrap(-halfW, 0);
    const xTo = gsap.quickTo(el, "x", { duration: 1.5, ease: "power4", modifiers: { x: gsap.utils.unitize(wrapX) } });

    const halfH = el.clientHeight / 2;
    const wrapY = gsap.utils.wrap(-halfH, 0);
    const yTo = gsap.quickTo(el, "y", { duration: 1.5, ease: "power4", modifiers: { y: gsap.utils.unitize(wrapY) } });

    let incrX = 0;
    let incrY = 0;
    const observer = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      onChangeX: (e) => {
        if (e.event.type === "wheel") incrX -= e.deltaX;
        else incrX += e.deltaX * 2;
        xTo(incrX);
      },
      onChangeY: (e) => {
        if (e.event.type === "wheel") incrY -= e.deltaY;
        else incrY += e.deltaY * 2;
        yTo(incrY);
      },
    });

    return () => { observer.kill(); };
  }, []);

  const images = Array.from({ length: numberOfImages }, (_, i) => `img${i + 1}.png`);

  const Grid = ({ dup = false }: { dup?: boolean }) => (
    <div className="pointer-events-none grid w-max grid-cols-5 p-[5vw]" style={{ gap }} aria-hidden={dup || undefined}>
      {images.map((name, i) => (
        <div key={`${dup ? "dup" : "orig"}-${i}`} className={cx("aspect-square select-none", imageClassName)}>
          <img src={`${imageRootPath}/${name}`} alt="" className="block h-full w-full object-contain" />
        </div>
      ))}
    </div>
  );

  return (
    <section className={cx("pointer-events-none h-screen w-full overflow-hidden", className)}>
      <div ref={containerRef} className="grid w-max grid-cols-2 will-change-transform">
        <Grid />
        <Grid dup />
        <Grid dup />
        <Grid dup />
      </div>
    </section>
  );
};

export const InfiniteCanvasDemo = () => (
  <InfiniteCanvas imageClassName="w-[45vw] lg:w-[15vw]" numberOfImages={15} imageRootPath="/assets/ic" gap="5vw" />
);

export default InfiniteCanvas;
