"use client";

/**
 * StairsPreloader — 화면을 덮은 N개의 세로 컬럼(계단)이 우→좌 stagger 로 height 0 으로 접히며 사라지고,
 * 중앙 헤드라인이 페이드인(길게)했다가 퇴장 시 페이드아웃하는 프리로더.
 *
 *  - 컬럼: 각 100/N vw, exit 시 height 100%→0, delay 0.4 + 0.05·(N-1-i)(오른쪽부터), ease [.33,1,.68,1], duration .5.
 *  - 헤드라인: 진입 opacity 0→1(duration 4·천천히), 단어별 stagger(delay .2·i), 퇴장 opacity→0(duration .6).
 *  - 부모가 <AnimatePresence mode="wait"> 로 감싸 show 토글하면 등장/퇴장이 자연스럽게 재생된다.
 *
 * Skiper UI skiper9 (https://skiper-ui.com/v1/skiper9 "Stairs preloader") 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기 필수).
 * 트랜지션·딜레이·이징 원본 그대로.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type StairsPreloaderProps = {
  /** 컬럼(계단) 개수 (default 5) */
  columns?: number;
  /** 컬럼 색 (default 검정) */
  columnColor?: string;
  /** 중앙 헤드라인 (빈 문자열이면 숨김) */
  headline?: string;
  headlineColor?: string;
  className?: string;
};

const EASE = [0.33, 1, 0.68, 1] as const;

export const StairsPreloader = ({
  columns = 5,
  columnColor = "#000",
  headline = "The first-ever AGI. Period.",
  headlineColor = "#fff",
  className = "",
}: StairsPreloaderProps) => {
  return (
    <motion.div className={`fixed inset-0 z-50 ${className}`}>
      {/* 중앙 헤드라인 */}
      {headline && (
        <div className="absolute z-10 flex h-full w-full items-center justify-center text-center" style={{ color: headlineColor }}>
          <motion.h1
            className="text-3xl font-semibold tracking-tighter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 4 } }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
          >
            {headline.split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.2 * i }}
                className="mr-2 inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>
        </div>
      )}

      {/* 계단(컬럼) 레이어 */}
      <motion.div className="pointer-events-none fixed left-0 top-0 z-[2] flex h-screen">
        {Array.from({ length: columns }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: "100%" }}
            animate={{ height: "100%" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.5, delay: 0.4 + 0.05 * (columns - 1 - i), ease: EASE }}
            className="h-full"
            style={{ width: `${100 / columns}vw`, background: columnColor }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

/**
 * 부모에서 쓰는 패턴:
 *   <AnimatePresence mode="wait">{loading && <StairsPreloader />}</AnimatePresence>
 *
 * 아래 데모는 마운트 후 duration 동안 보여줬다 사라진다(원본 = 2500ms).
 */
export const StairsPreloaderDemo = ({ duration = 2500 }: { duration?: number }) => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(t);
  }, [duration]);
  return (
    <main className="relative h-full w-full">
      <AnimatePresence mode="wait">{show && <StairsPreloader />}</AnimatePresence>
      <section className="flex h-full w-full items-center justify-center bg-white text-black">
        Your crazy Landing page
      </section>
    </main>
  );
};

export default StairsPreloader;
