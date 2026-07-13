"use client";

/**
 * HoverMembers — 아바타 행에 호버하면 아바타가 커지고(60→120), 화살표 커스텀 커서가 스프링으로 따라오며,
 * 뒤의 거대한 텍스트(28vw)가 기본 이름 ↔ 호버한 멤버 이름으로 글자별 슬라이드 스왑된다.
 *
 *  - 아바타: width/height 60→120, duration .2 easeOut.
 *  - 커서: x/y 스프링(stiffness 71 / damping 16 / mass .1), scale 스프링(stiffness 150 / damping 10).
 *  - 대형 텍스트: 기본 이름은 위에서(down), 멤버 이름은 아래에서(up) 글자별 슬라이드. stagger = .055·|i−⌊len/2⌋|, ease [.19,1,.22,1].
 *
 * Skiper UI skiper6 (skiper-ui.com) 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기). 스프링·variants·stagger 원본 그대로.
 * ※ 원본은 'Thunder' 디스플레이 폰트 사용. 미보유 시 프로젝트 기본 산세리프로 대체(원하면 컨테이너에 폰트 클래스 지정).
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useSpring } from "framer-motion";

export type TeamMember = { name: string; image: string };

export type HoverMembersProps = {
  teamMembers: TeamMember[];
  defaultName?: string;
  className?: string;
  backgroundColor?: string;
  textColor?: string; // Tailwind 클래스
  hoverTextColor?: string; // Tailwind 클래스
  cursorColor?: string; // Tailwind 클래스
};

const XY_SPRING = { mass: 0.1, damping: 16, stiffness: 71 };
const SCALE_SPRING = { mass: 0.1, damping: 10, stiffness: 150 };
const EASE = [0.19, 1, 0.22, 1] as const;
const stagger = (i: number, len: number) => 0.055 * Math.abs(i - Math.floor(len / 2));

const up = { hidden: { y: "100%" }, visible: { y: "0%" }, exit: { y: "-100%" } };
const down = { hidden: { y: "-100%" }, visible: { y: "0%" }, exit: { y: "0%" } };

const ArrowCursor = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="h-5 w-5">
    <path d="M6.52182 2.75026L12.8858 9.11422L15.253 0.38299L6.52182 2.75026Z" fill="white" />
    <path d="M0.333095 12.3331L3.30294 15.3029L10.3402 6.56864L9.0674 5.29585L0.333095 12.3331Z" fill="white" />
  </svg>
);

const Avatar = ({ member, index, onHover }: { member: TeamMember; index: number; onHover: (i: number | null) => void }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      className="relative cursor-pointer p-[2.5px] md:p-[5px]"
      style={{ width: hovered ? 120 : 60, height: hovered ? 120 : 60 }}
      animate={{ width: hovered ? 120 : 60, height: hovered ? 120 : 60 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onHoverStart={() => { setHovered(true); onHover(index); }}
      onHoverEnd={() => { setHovered(false); onHover(null); }}
    >
      <img src={member.image} alt={member.name} className="h-full w-full rounded-lg object-cover" />
    </motion.div>
  );
};

const BigName = ({ text, colorClass, variant }: { text: string; colorClass: string; variant: typeof up | typeof down }) => (
  <motion.div className="absolute w-full text-center" initial="hidden" animate="visible" exit="hidden" transition={{ duration: 0.8, ease: EASE }}>
    <h1 className={`select-none ${text.includes(" ") ? "" : "whitespace-nowrap"} text-[28vw] font-semibold uppercase leading-none ${colorClass}`}>
      {Array.from(text).map((ch, i) => (
        <motion.span key={i} className="inline-block" variants={variant} transition={{ duration: 0.8, ease: EASE, delay: stagger(i, text.length) }}>
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
    </h1>
  </motion.div>
);

export const HoverMembers = ({
  teamMembers,
  defaultName = "SKIPER-UI",
  className,
  backgroundColor = "#121212",
  textColor = "text-white",
  hoverTextColor = "text-red-500",
  cursorColor = "bg-red-500",
}: HoverMembersProps) => {
  const [active, setActive] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const x = useSpring(0, XY_SPRING);
  const y = useSpring(0, XY_SPRING);
  const scale = useSpring(0, SCALE_SPRING);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-screen w-screen" style={{ backgroundColor }} />;

  return (
    <section className={`relative flex h-full w-full flex-1 flex-col items-center justify-center gap-10 overflow-hidden text-white ${className || ""}`} style={{ backgroundColor }}>
      <div
        ref={rowRef}
        className="absolute top-[10%] z-[99] flex h-[120px] w-max max-w-[90%] flex-wrap items-center justify-center md:max-w-none"
        onPointerMove={(e) => {
          const r = rowRef.current?.getBoundingClientRect();
          if (!r) return;
          x.set(e.clientX - r.left);
          y.set(e.clientY - r.top);
        }}
        onPointerEnter={() => scale.set(1)}
        onPointerLeave={() => scale.set(0)}
      >
        {teamMembers.map((m, i) => (
          <Avatar key={m.name} member={m} index={i} onHover={setActive} />
        ))}
        <motion.div
          style={{ x, y, scale, transformOrigin: "left top" }}
          className={`pointer-events-none absolute left-0 top-0 z-10 flex size-[120px] items-center justify-center rounded-full ${cursorColor}`}
        >
          <ArrowCursor />
        </motion.div>
      </div>

      <div className="relative h-[22vw] w-full overflow-hidden">
        <AnimatePresence>
          {active === null && <BigName key="default" text={defaultName} colorClass={textColor} variant={down} />}
        </AnimatePresence>
        {teamMembers.map((m, i) => (
          <AnimatePresence key={m.name}>
            {active === i && <BigName text={m.name} colorClass={hoverTextColor} variant={up} />}
          </AnimatePresence>
        ))}
      </div>
    </section>
  );
};

export const demoMembers: TeamMember[] = [
  { name: "Faffa", image: "/assets/m1.jpg" },
  { name: "Kaint", image: "/assets/m2.jpg" },
  { name: "Atto", image: "/assets/m3.jpg" },
  { name: "Bamb", image: "/assets/m4.jpg" },
  { name: "Sira", image: "/assets/m5.jpg" },
  { name: "Koka", image: "/assets/m6.jpg" },
  { name: "Pippi", image: "/assets/m7.jpg" },
  { name: "Sawa", image: "/assets/m8.jpg" },
  { name: "Kham", image: "/assets/m9.jpg" },
];

export const HoverMembersDemo = () => <HoverMembers teamMembers={demoMembers} />;

export default HoverMembers;
