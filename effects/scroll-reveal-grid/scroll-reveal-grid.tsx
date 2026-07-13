"use client";

/**
 * ScrollRevealGrid — 긴 스크롤 트랙(900vh) 위에 sticky 로 고정된 N열 그리드. 스크롤을 내리면 각 카드가
 * 자기 구간(scrollYProgress [i/N, (i+1)/N])에서 차례로 reveal 된다.
 *
 *  - 카드 이미지/번호/텍스트가 y(-50→0 위 / 50→0 아래) + opacity(0→1) + 번호 scale(0→1) 로 등장.
 *  - 좌측에 진행도 바(scaleX = scrollYProgress, 첫 구간 scaleY).
 *  - 데스크톱은 sticky 가로 그리드, 모바일은 세로 리스트.
 *
 * Skiper UI skiper104 (skiper-ui.com) 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기). 스크롤 transform·수치 원본 그대로.
 */

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

export type RevealItem = { bgSrc: string; title: string; desc: string };

export type ScrollRevealGridProps = {
  items: RevealItem[];
  className?: string;
  /** 트랙 높이 (default "900vh") */
  trackHeight?: string;
  accent?: string; // 번호·진행바 색 (default orange-500)
};

const Card = ({ item, index, total, scrollYProgress, accent }: {
  item: RevealItem; index: number; total: number; scrollYProgress: MotionValue<number>; accent: string;
}) => {
  const start = index / total;
  const end = (index + 1) / total;
  const yImg = useTransform(scrollYProgress, [start, end], [-50, 0]);
  const yText = useTransform(scrollYProgress, [start, end], [50, 0]);
  const scaleNum = useTransform(scrollYProgress, [start, end], [0, 1]);
  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);

  return (
    <div className="relative z-[2] flex flex-col gap-10">
      <motion.div style={{ y: yImg, opacity }} className="group relative flex h-60 w-full items-center justify-center rounded-2xl">
        <img src={item.bgSrc} alt="" className="h-full w-full rounded-xl object-cover" />
      </motion.div>
      <motion.div style={{ scale: scaleNum, background: accent }} className="flex size-8 items-center justify-center text-white">{index + 1}</motion.div>
      <motion.div style={{ y: yText, opacity }} className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tighter">{item.title}</h2>
        <p className="opacity-65">{item.desc}</p>
      </motion.div>
    </div>
  );
};

const DesktopTrack = ({ items, trackHeight, accent }: { items: RevealItem[]; trackHeight: string; accent: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const barScaleY = useTransform(scrollYProgress, [0, 1 / items.length], [0, 1]);

  return (
    <div className="hidden items-center justify-center lg:flex">
      <div ref={ref} style={{ height: trackHeight }}>
        <div className="sticky top-1/2 grid w-full max-w-7xl -translate-y-1/2 gap-20" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item, i) => (
            <Card key={i} item={item} index={i} total={items.length} scrollYProgress={scrollYProgress} accent={accent} />
          ))}
          <motion.div style={{ scaleX: scrollYProgress, scaleY: barScaleY, background: accent }} className="absolute left-4 top-[296px] h-1 w-full origin-left" />
        </div>
      </div>
    </div>
  );
};

const MobileList = ({ items, accent }: { items: RevealItem[]; accent: string }) => (
  <div className="relative my-32 flex w-full flex-col gap-32 pl-12 pr-2 lg:hidden">
    {items.map((item, i) => (
      <div key={i} className="relative z-[2] flex flex-col gap-4">
        <div className="absolute left-1 flex size-8 items-center justify-center text-white" style={{ background: accent }}>{i + 1}</div>
        <div className="relative flex h-60 w-full items-center justify-center rounded-xl">
          <img src={item.bgSrc} alt="" className="h-full w-full rounded-xl object-cover" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tighter">{item.title}</h2>
          <p className="opacity-65">{item.desc}</p>
        </div>
      </div>
    ))}
    <div className="absolute left-4 top-2 h-[99%] w-1 origin-left" style={{ background: accent }} />
  </div>
);

export const ScrollRevealGrid = ({ items, className = "", trackHeight = "900vh", accent = "#f97316" }: ScrollRevealGridProps) => (
  <div className={className}>
    <div className="mt-36 -mb-36 grid content-start justify-items-center gap-6 text-center">
      <span className="relative max-w-[14ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:to-current after:content-['']">
        Scroll below to see effect
      </span>
    </div>
    <DesktopTrack items={items} trackHeight={trackHeight} accent={accent} />
    <MobileList items={items} accent={accent} />
  </div>
);

export const demoItems: RevealItem[] = [
  { bgSrc: "/assets/c1.jpg", title: "First ever to do that", desc: "We are the first ever to do this — bold claim, decent funding, big plans." },
  { bgSrc: "/assets/c2.jpg", title: "Revolutionary approach", desc: "Our innovative solution transforms how you think about design and development." },
  { bgSrc: "/assets/c3.jpg", title: "Next level experience", desc: "Experience the future of interfaces with advanced features and seamless integration." },
];

export const ScrollRevealGridDemo = () => <ScrollRevealGrid items={demoItems} />;

export default ScrollRevealGrid;
