"use client";

/**
 * ScrollImagesReveal — 2열 그리드의 이미지 카드들이 스크롤에 따라 3D 원근 변형으로 리빌되는 효과.
 *
 *  - 각 카드는 자신의 스크롤 진행도(useScroll, offset ["start end","end start"])로
 *    rotateX(70→0→-50) · rotateZ · skewX · x · y · scaleY(1.8→1→1.1) · filter(blur/brightness/contrast)를 구동.
 *  - 좌/우 열(index%2)이 서로 미러링되어 가운데로 모였다 멀어지는 깊이감을 만든다.
 *  - perspective 800px. 매끈한 느낌을 위해 Lenis 같은 스무스 스크롤과 함께 쓰면 좋다(선택).
 *
 * Skiper UI skiper33 (https://skiper-ui.com/v1/skiper33 "Scroll images reveal 002") 의 Framer Motion 변형 충실 포팅
 * — free 라이선스(자유 사용·수정, 출처표기 필수). 스크롤 transform·구간·수치 원본 그대로.
 * (원본은 GSAP ScrollTrigger 변형도 함께 제공한다.)
 */

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export type ScrollImagesRevealProps = {
  /** 이미지 URL 배열 */
  images: string[];
  className?: string;
  /** 상단 캡션 (빈 문자열이면 숨김) */
  caption?: string;
};

const Card = ({ img, isLeft }: { img: string; isLeft: boolean }) => {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [70, 0, -50]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.5, 1], isLeft ? [5, 0, -1] : [-5, 0, 1]);
  const x = useTransform(scrollYProgress, [0, 0.5, 0.7, 1], isLeft ? ["-40%", "0%", "0%", "-10%"] : ["40%", "0%", "0%", "10%"]);
  const skewX = useTransform(scrollYProgress, [0, 0.5, 1], isLeft ? [-5, 0, 5] : [5, 0, -5]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], ["40%", "0%", "-10%"]);
  const blur = useTransform(scrollYProgress, [0, 0.5, 1], [7, 0, 4]);
  const brightness = useTransform(scrollYProgress, [0, 0.5, 1], [0, 100, 0]);
  const contrast = useTransform(scrollYProgress, [0, 0.5, 1], [180, 110, 180]);
  const scaleY = useTransform(scrollYProgress, [0, 0.5, 1], [1.8, 1, 1.1]);
  const filter = useTransform([blur, brightness, contrast], ([b, br, c]: number[]) => `blur(${b}px) brightness(${br}%) contrast(${c}%)`);

  return (
    <motion.figure ref={ref} className="relative z-10 m-0" style={{ perspective: "800px", willChange: "transform", z: 300 }}>
      <motion.div
        className="relative aspect-[1/1.2] w-full overflow-hidden rounded"
        style={{ y, x, rotateX, rotateZ, skewX, filter, scaleY }}
      >
        <motion.div className="absolute -left-0 -top-0 h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
      </motion.div>
    </motion.figure>
  );
};

export const ScrollImagesReveal = ({ images, className = "", caption = "Perspective scroll effect" }: ScrollImagesRevealProps) => {
  // 그리드를 풍성하게: 앞 4장을 한번 더 이어 붙임(원본 동일)
  const grid = [...images, ...images.slice(0, 4)];
  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div className="relative w-full overflow-hidden">
        {caption && (
          <div className="absolute left-1/2 top-[5.5rem] z-10 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center">
            <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:to-current after:content-['']">
              {caption}
            </span>
          </div>
        )}
        <section className="relative grid w-full place-items-center">
          <div className="relative mb-[10vh] mt-[20vh] grid w-full max-w-sm grid-cols-2 gap-8 py-[20vh]">
            {grid.map((img, i) => (
              <Card key={i} img={img} isLeft={i % 2 === 0} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export const demoImages: string[] = Array.from({ length: 16 }, (_, i) => `/assets/img${i + 1}.png`);

export const ScrollImagesRevealDemo = () => <ScrollImagesReveal images={demoImages} />;

export default ScrollImagesReveal;
