"use client";

/**
 * GooeyMenu — 로고 버튼에 호버하면, 위로 끈적하게(gooey) 분리되며 정보 패널이 펼쳐지는 효과.
 *
 *  - SVG goo 필터(feGaussianBlur 4.4 → feColorMatrix 알파 "20 -7")로 둥근 버튼과 패널이 액체처럼 이어졌다 떨어진다.
 *  - 호버 시 작은 원형 버튼(40×40, r20)에서 패널(200×auto, r10)이 y:-50 으로 솟으며 spring(stiffness 300 / damping 30) 전개.
 *  - 패널 내용은 blur(4px)→0 으로 디블러 페이드인.
 *
 * Skiper UI skiper46 (skiper-ui.com) 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기). 모션·필터값 원본 그대로.
 */

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type GooeyRow = { label: string; value: string; danger?: boolean };

export type GooeyMenuProps = {
  /** 패널에 표시할 행들 */
  rows?: GooeyRow[];
  /** 로고(미지정 시 Next.js 마크) */
  logo?: React.ReactNode;
  className?: string;
  color?: string; // 버튼·패널 색 (default 검정)
};

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

const NextMark = () => {
  const id = useId().replace(/:/g, "");
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ translate: "-0.5px" }}>
      <g clipPath={`url(#${id}-clip)`}>
        <path d="M17.2571 18.5026L4.75568 2.39941H2.40027V13.5947H4.2846V4.79242L15.7779 19.642C16.2965 19.2949 16.7906 18.914 17.2571 18.5026Z" fill={`url(#${id}-p0)`} />
        <rect x="11.8892" y="2.39941" width="1.86667" height="11.2" fill={`url(#${id}-p1)`} />
      </g>
      <defs>
        <linearGradient id={`${id}-p0`} x1="10.9558" y1="12.1216" x2="16.478" y2="18.9661" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" /><stop offset="0.604072" stopColor="white" stopOpacity="0" /><stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-p1`} x1="12.8225" y1="2.39941" x2="12.7912" y2="10.6244" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-clip`}><rect width="16" height="16" fill="white" /></clipPath>
      </defs>
    </svg>
  );
};

export const GooeyMenu = ({
  rows = [
    { label: "Next.js", value: "v13.4.8" },
    { label: "Errors", value: "3", danger: true },
    { label: "Route", value: "Static" },
  ],
  logo,
  className = "",
  color = "#000",
}: GooeyMenuProps) => {
  const [open, setOpen] = useState(false);
  const gooId = `goo-${useId().replace(/:/g, "")}`;

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* goo 필터 */}
      <svg xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 left-0" version="1.1">
        <defs>
          <filter id={gooId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -7" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <motion.div style={{ filter: `url(#${gooId})` }} className="absolute bottom-[40%] left-1/2 -translate-x-1/2">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ y: 0, width: 40, height: 40, borderRadius: 20 }}
              animate={{ y: -50, width: 200, height: "auto", borderRadius: 10, transition: { ...SPRING, delay: 0.15, y: { ...SPRING, delay: 0 } } }}
              exit={{ y: 0, width: 40, height: 40, borderRadius: 20, transition: { ...SPRING, y: { ...SPRING, delay: 0.15 } } }}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className="absolute bottom-0 overflow-hidden rounded-full"
              style={{ background: color }}
            >
              <motion.div
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                className="grid w-[200px] space-y-3 p-4 text-white"
              >
                {rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    {i === 0 ? (
                      <>
                        <span className="text-sm tracking-tighter opacity-50">{r.label}</span>
                        <span className="text-right text-sm tracking-tighter opacity-50">{r.value}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold">{r.label}</span>
                        <span className={`text-right text-sm font-semibold ${r.danger ? "text-red-500" : "opacity-45"}`}>{r.value}</span>
                      </>
                    )}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="relative flex size-10 cursor-pointer items-center justify-center rounded-full after:absolute after:bottom-0 after:h-[150%] after:w-full after:rounded-b-full after:p-5 after:content-['']"
          style={{ background: color }}
        >
          {logo ?? <NextMark />}
        </div>
      </motion.div>
    </div>
  );
};

export const GooeyMenuDemo = () => (
  <div className="grid h-screen w-full place-items-center bg-white">
    <div className="relative h-64 w-64"><GooeyMenu /></div>
  </div>
);

export default GooeyMenu;
