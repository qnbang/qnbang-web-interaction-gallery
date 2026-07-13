"use client";

/**
 * ExpandPanels — 호버(데스크톱)/탭(모바일)로 한 패널이 펼쳐지며 이미지가 드러나는 패널 갤러리.
 *
 *  - 데스크톱: 가로 패널, hover 시 그 패널 width 4rem → 28rem (spring stiffness 200 / damping 25). 라벨은 세로(-rotate-90).
 *  - 모바일: 세로 스택, 탭 시 height 4rem → 500px.
 *  - 활성 패널: 라벨 색 밝아지고(#F1F1F1) 연도가 x:-20→0 슬라이드인, 이미지 opacity 0→1.
 *
 * Skiper UI skiper35 (skiper-ui.com) 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기). 스프링·레이아웃·수치 원본 그대로.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type PanelItem = { id: number | string; label: string; year?: string; image: string };

export type ExpandPanelsProps = {
  items: PanelItem[];
  className?: string;
  /** 초기 활성 인덱스 (default 마지막) */
  defaultActive?: number;
  mobileQuery?: string;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const on = () => setMatches(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export const ExpandPanels = ({ items, className = "", defaultActive, mobileQuery = "(max-width: 767px)" }: ExpandPanelsProps) => {
  const [active, setActive] = useState(defaultActive ?? items.length - 1);
  const isMobile = useMediaQuery(mobileQuery);

  return (
    <section className={`h-full w-full bg-[#121212] text-[#F1F1F1] ${className}`}>
      <div className="overflow-hidden md:h-full">
        <motion.div className="mx-auto flex w-full flex-col md:h-full md:flex-row lg:min-w-[1600px]">
          {items.map((item, i) => {
            const isActive = active === i;
            return (
              <motion.div
                key={item.id}
                className="relative h-full w-full cursor-pointer border-0 border-white/30 lg:border-r"
                onClick={isMobile ? () => setActive(i) : undefined}
                onMouseEnter={isMobile ? undefined : () => setActive(i)}
                initial={isMobile ? { height: "4rem", width: "100%" } : { width: "4rem", height: "100%" }}
                animate={isMobile ? { height: isActive ? "500px" : "4rem", width: "100%" } : { width: isActive ? "28rem" : "4rem" }}
                transition={{ stiffness: 200, damping: 25, type: "spring" }}
              >
                <motion.div
                  className="absolute bottom-0 left-[2vw] flex w-[calc(100vh-2.6vw)] origin-[0_50%] transform justify-between pr-5 text-xl font-medium leading-[2.6vw] tracking-[-0.03em] md:-rotate-90 md:text-[2vw]"
                  animate={{ color: isActive ? "#F1F1F1" : "rgba(241, 241, 241, 0.3)" }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="w-full border-b py-2 md:w-auto md:border-0 md:py-0">{item.label}</p>
                  <AnimatePresence>
                    {isActive && item.year && (
                      <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                        {item.year}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  className="h-[92%] rounded-[0.6vw] object-cover pl-2 pr-[1.3vw] pt-[1.3vw] md:h-full md:pb-[1.3vw] md:pl-[4vw]"
                >
                  <motion.img src={item.image} alt={item.label} className="w-full rounded-xl" style={{ height: "100%", objectFit: "cover" }} transition={{ duration: 0.4, ease: "easeOut" }} />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export const demoItems: PanelItem[] = [
  { id: 1, label: "Velvet Dreams", year: "2024", image: "/assets/p1.jpg" },
  { id: 2, label: "Neon Pulse", year: "2024", image: "/assets/p2.jpg" },
  { id: 3, label: "Midnight Canvas", year: "2024", image: "/assets/p3.jpg" },
  { id: 4, label: "Echo Lab", year: "2023", image: "/assets/p4.jpg" },
  { id: 5, label: "Cosmic Brew", year: "2023", image: "/assets/p5.jpg" },
  { id: 6, label: "Horizon Type", year: "2024", image: "/assets/p6.jpg" },
  { id: 7, label: "Stellar Studio", year: "2023", image: "/assets/p7.jpg" },
  { id: 8, label: "Prism House", year: "2022", image: "/assets/p8.jpg" },
];

export const ExpandPanelsDemo = () => <ExpandPanels items={demoItems} />;

export default ExpandPanels;
