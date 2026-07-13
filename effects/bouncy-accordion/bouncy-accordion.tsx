"use client";

/**
 * BouncyAccordion — 쌓인 카드형 아코디언. 항목을 클릭하면 그 카드가 스택에서 분리되듯 커지고(height 45→93,
 * marginBlock 0→10) 자신과 인접 항목의 모서리가 둥글어지며(borderRadius 모핑) 설명이 디블러 페이드인된다.
 *
 *  - 클릭 토글(같은 항목 재클릭/바깥 클릭 시 닫힘).
 *  - 전개는 framer-motion spring(stiffness 300 / damping 20) — 탄성 있는 손맛.
 *  - 활성 항목의 모서리(top: 자신·위이웃 / bottom: 자신·아래이웃)가 20px 로 둥글어져 '카드 분리' 느낌.
 *  - 설명: opacity 0→.6, blur(2px)→0.
 *
 * Skiper UI skiper103 (skiper-ui.com) 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기). 모핑·스프링 수치 원본 그대로.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type AccordionFeature = { icon?: React.ReactNode; title: string; description: string };

export type BouncyAccordionProps = {
  items: AccordionFeature[];
  className?: string;
  /** 초기 활성 인덱스 (default 2) */
  defaultActive?: number | null;
  /** 항목 카드 색 */
  cardColor?: string;
};

const Chevron = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 24 24" className={`absolute right-4 size-4 transition-transform duration-300 ${active ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const BouncyAccordion = ({ items, className = "", defaultActive = 2, cardColor = "#ececee" }: BouncyAccordionProps) => {
  const [active, setActive] = useState<number | null>(defaultActive);

  return (
    <div onClick={() => setActive(null)} className={`flex size-full select-none flex-col items-center justify-center ${className}`}>
      <div className="-mt-36 mb-36 grid content-start justify-items-center gap-6 text-center">
        <span className="relative max-w-[14ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-transparent after:to-current after:content-['']">
          Click on items to expand &amp; collapse
        </span>
      </div>

      <ul className="w-[300px]">
        {items.map((item, o) => {
          const isActive = active === o;
          const rTop = o === 0 || isActive || (active !== null && o === active + 1) ? "20px" : "0px";
          const rBot = o === items.length - 1 || isActive || (active !== null && o === active - 1) ? "20px" : "0px";
          return (
            <motion.li
              key={o}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActive(o === active ? null : o);
              }}
              animate={{
                marginBlock: isActive ? "10px" : "0px",
                height: isActive ? "93px" : "45px",
                borderTopLeftRadius: rTop, borderTopRightRadius: rTop,
                borderBottomRightRadius: rBot, borderBottomLeftRadius: rBot,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative cursor-pointer gap-2 overflow-hidden px-2"
              style={{ background: cardColor }}
            >
              <div className="flex h-fit items-center gap-2 pl-3 pt-2.5">
                {item.icon && <div className="scale-90">{item.icon}</div>}
                <span className="text-sm opacity-75">{item.title}</span>
                <Chevron active={isActive} />
              </div>
              <AnimatePresence>
                {isActive && (
                  <motion.p
                    initial={{ opacity: 0, filter: "blur(2px)" }}
                    animate={{ opacity: 0.6, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(2px)" }}
                    className="px-3 py-2 text-sm opacity-60"
                  >
                    {item.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};

const ic = (d: string) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export const demoItems: AccordionFeature[] = [
  { icon: ic("M4 6h16M4 12h10M4 18h7"), title: "Type Shit", description: "Fast, accurate typing with real-time validation and helpful hints." },
  { icon: ic("M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.2L12 17.8 6.1 20.3l1.3-6.2L2.7 9.6l6.3-.7L12 3Z"), title: "Star Great", description: "Mark favorites and rate items with smooth micro-interactions." },
  { icon: ic("M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"), title: "Schedule", description: "Plan tasks with timelines, reminders, and conflict detection." },
  { icon: ic("M6 6h15l-1.5 9h-13zM6 6 5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"), title: "Buy Stuff", description: "Streamlined checkout with secure payments and transparent pricing." },
  { icon: ic("M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"), title: "Triangle Warning", description: "Surface critical alerts with accessible, non-intrusive messaging." },
  { icon: ic("M3 6h18v12H3zM3 10h18M7 15h4"), title: "Account bal", description: "Track balances, recent activity, and spending insights at a glance." },
];

export const BouncyAccordionDemo = () => (
  <div className="grid min-h-screen place-items-center bg-white text-black">
    <BouncyAccordion items={demoItems} />
  </div>
);

export default BouncyAccordion;
