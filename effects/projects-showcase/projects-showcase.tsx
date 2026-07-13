"use client";

/**
 * ProjectsShowcase — 프로젝트 리스트. 호버하면 드래그 가능한 프리뷰 이미지가 바뀌고(layoutId="active-img"),
 * 항목을 클릭하면 그 타이틀과 이미지가 리스트 위치에서 상세 화면으로 부드럽게 모핑(layoutId 공유요소 전환)된다.
 *
 *  - 리스트: 활성 항목 opacity 1 / 나머지 .5, 활성 항목 끝에 작은 점(x:10, 15px→4px) 등장.
 *  - 프리뷰: 좌상단 고정 + drag, 호버한 프로젝트 이미지로 즉시 교체(같은 layoutId 라 모핑).
 *  - 클릭 → 상세: 타이틀(text-header-N)·이미지(active-img)가 모핑, 본문은 staggerChildren .1 / delayChildren .25 로 등장.
 *  - 상세 클릭 → 리스트로 복귀.
 *
 * Skiper UI skiper80 (skiper-ui.com) 충실 포팅 — free 라이선스(자유 사용·수정, 출처표기). layoutId 전환·수치 원본 그대로.
 */

import { useState } from "react";
import { motion } from "framer-motion";

export type ShowcaseProject = { title: string; img: string };

export type ProjectsShowcaseProps = {
  projects: ShowcaseProject[];
  className?: string;
  /** 상세 본문(클릭 시 우측/하단에 stagger 등장). 미지정 시 기본 더미. */
  detail?: React.ReactNode;
  foreground?: string;
  background?: string;
};

const DefaultDetail = () => (
  <>
    <section className="w-full">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Billion Dollar Saas</h1>
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.35, duration: 0.5 }} className="h-0.5 flex-1 origin-left rounded-full bg-current" />
      </div>
    </section>
    <div className="mt-4 flex flex-col gap-2 opacity-50">
      <p className="text-sm">A short blurb about the project — what it is, who it's for, and why it matters. Replace with your own copy.</p>
      <p className="text-sm leading-6">Want to create something cool together? Let's do it.</p>
    </div>
    <div className="mt-10 flex items-center gap-2.5">
      <a href="#" onClick={(e) => e.preventDefault()} className="flex h-9 items-center gap-2 rounded-xl bg-current px-3 text-sm"><span className="mix-blend-difference text-white">Live Preview ↗</span></a>
      <a href="#" onClick={(e) => e.preventDefault()} className="flex h-9 items-center gap-2 rounded-xl border px-3 text-sm font-medium">See Source Code →</a>
    </div>
  </>
);

export const ProjectsShowcase = ({
  projects,
  className = "",
  detail,
  foreground = "#111",
  background = "#fff",
}: ProjectsShowcaseProps) => {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className={`flex min-h-screen w-screen justify-center py-32 ${className}`} style={{ color: foreground, background }}>
      {open === null ? (
        <>
          <motion.img
            drag
            layoutId="active-img"
            style={{ borderRadius: "25px" }}
            className="fixed left-[15%] top-[10%] h-52 aspect-video -translate-x-1/2 border object-cover"
            src={projects[active].img}
            alt=""
          />
          <ul className="fixed bottom-[20%] right-[10%] flex flex-col gap-2">
            <li className="flex w-full items-center gap-3 text-sm uppercase opacity-50">
              my Projects<span className="h-px flex-1 bg-current" />
            </li>
            {projects.map((p, i) => (
              <motion.li
                key={p.title}
                layoutId={`text-header-${i}`}
                style={{ opacity: active === i ? 1 : 0.5 }}
                className="relative flex w-fit cursor-pointer items-center text-4xl tracking-tighter"
                onMouseEnter={() => setActive(i)}
                onClick={() => setOpen(i)}
              >
                {p.title}{" "}
                {active === i && (
                  <motion.div
                    initial={{ x: 10, width: "15px", height: "0px" }}
                    animate={{ x: 10, width: "4px", height: "4px" }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-full rounded-full bg-current"
                  />
                )}
              </motion.li>
            ))}
          </ul>
        </>
      ) : (
        <div onClick={() => setOpen(null)} className="w-full">
          <div className="mx-auto flex flex-col items-center justify-center gap-12">
            <div className="w-full max-w-xl space-y-12">
              <div className="relative h-24 text-7xl font-medium">
                <motion.h1 className="absolute" layoutId={`text-header-${open}`}>{projects[active].title}</motion.h1>
              </div>
              <motion.img layoutId="active-img" style={{ borderRadius: "25px" }} src={projects[active].img} alt="" className="h-84 w-full object-cover" />
            </div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.25 } } }}
            >
              <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="mx-auto w-full max-w-xl" transition={{ type: "spring", stiffness: 50, damping: 10 }}>
                {detail ?? <DefaultDetail />}
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export const demoProjects: ShowcaseProject[] = [
  { title: "Skiper OSS 001", img: "/assets/s1.jpg" },
  { title: "NeonSync Pro", img: "/assets/s2.jpg" },
  { title: "PixelForge Studio", img: "/assets/s3.jpg" },
  { title: "TaskFlow Sonet", img: "/assets/s4.jpg" },
  { title: "CloudVibe Bruh", img: "/assets/s5.jpg" },
];

export const ProjectsShowcaseDemo = () => <ProjectsShowcase projects={demoProjects} />;

export default ProjectsShowcase;
