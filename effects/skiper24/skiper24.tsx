"use client";

/**
 * TikTikColorList — 스크롤 구동 컬러 리스트 (skiper24)
 *
 * 스크롤하면 항목이 차례로 활성화된다:
 *  - 활성 항목만 불투명(opacity 1), 나머지는 0.2로 페이드
 *  - 페이지 배경이 활성 항목의 bgColor 로 0.5s 애니메이션(framer-motion)
 *  - 우하단 드래그 가능한 프리뷰 카드가 활성 항목 이미지로 스왑
 *  - 항목 전환 시 tick 사운드(use-sound)
 *  - 무한 스크롤(원본 N개를 10세트 반복 + 바닥 근처서 5세트씩 추가)
 *
 * 출처: skiper-ui.com /v1/skiper24 "Tik tik color list" 를 clonecraft 경로1로 이식.
 * 원본 풀 프로젝트: clones/_완료/skiper24/
 *
 * 자기완결 단일 파일(드롭인). 외부 의존: react, framer-motion, gsap, use-sound, clsx, tailwind-merge.
 * Tailwind 프로젝트에 PP-MORI @font-face + font-pp-mori 유틸을 등록해야 타이포가 원본과 일치(README 참고).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useSound from "use-sound";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

gsap.registerPlugin(ScrollTrigger);

/** clsx + tailwind-merge (자기완결을 위해 인라인) */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 프로젝트(리스트 항목) 데이터 */
export type Project = {
  id: number;
  name: string;
  description: string;
  badge: string;
  /** 활성화 시 페이지 배경으로 깔리는 색 */
  bgColor: string;
  /** 우하단 프리뷰 이미지 경로(소비측 public 기준 또는 절대 URL) */
  image: string;
};

export type TikTikColorListProps = {
  projects: Project[];
  className?: string;
  /** 우하단 드래그 가능한 프리뷰 카드 표시 (default true) */
  showPreview?: boolean;
  /** 프리뷰 카드 크기 (default "lg") */
  previewSize?: "sm" | "md" | "lg";
  /** 항목이 활성화될 때 tick 사운드 재생 (default true) */
  enableSound?: boolean;
  /** tick 사운드 파일 경로 (default "/sfx/tick.wav") */
  soundSrc?: string;
  /** 무한 스크롤(리스트 반복 + 바닥 근처서 추가 로드) (default true) */
  infiniteScroll?: boolean;
  /** 바닥에서 이만큼 남았을 때 추가 로드(px) (default 1000) */
  scrollThreshold?: number;
};

const previewSizeClass: Record<NonNullable<TikTikColorListProps["previewSize"]>, string> = {
  sm: "h-[200px] w-[200px]",
  md: "h-[300px] w-[300px]",
  lg: "h-[400px] w-[400px]",
};

export const TikTikColorList = ({
  projects,
  className = "",
  showPreview = true,
  previewSize = "lg",
  enableSound = true,
  soundSrc = "/sfx/tick.wav",
  infiniteScroll = true,
  scrollThreshold = 1000,
}: TikTikColorListProps) => {
  // 활성 프로젝트(원본 데이터 기준, mod 인덱스) — 배경색·프리뷰 이미지 결정
  const [activeIndex, setActiveIndex] = useState(0);
  // 확장된(반복) 리스트에서 현재 활성 항목의 절대 인덱스 — 해당 항목만 불투명
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  // 화면에 렌더되는 확장 리스트
  const [items, setItems] = useState<Project[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isLoadingMore = useRef(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [playTick] = useSound(soundSrc, { volume: 0.5 });

  // 초기 리스트 구성: 무한 스크롤이면 원본을 10번 반복, 아니면 그대로
  useEffect(() => {
    if (!infiniteScroll) {
      setItems(projects);
      return;
    }
    const build = (repeats: number) => {
      const out: Project[] = [];
      for (let r = 0; r < repeats; r++) {
        projects.forEach((p, i) => {
          out.push({ ...p, id: r * projects.length + i });
        });
      }
      return out;
    };
    setItems(build(10));
  }, [projects, infiniteScroll]);

  // 바닥 근처에 도달하면 5세트씩 추가 로드
  const handleScroll = useCallback(() => {
    if (!infiniteScroll || isLoadingMore.current) return;
    const scrollY = window.scrollY;
    if (
      scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - scrollThreshold
    ) {
      isLoadingMore.current = true;
      setTimeout(() => {
        setItems((prev) => {
          const baseSets = prev.length / projects.length;
          const next: Project[] = [];
          for (let r = 0; r < 5; r++) {
            projects.forEach((p, i) => {
              next.push({ ...p, id: (baseSets + r) * projects.length + i });
            });
          }
          return [...prev, ...next];
        });
        isLoadingMore.current = false;
      }, 500);
    }
  }, [projects, infiniteScroll, scrollThreshold]);

  useEffect(() => {
    if (!infiniteScroll) return;
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll, infiniteScroll]);

  // 항목별 ScrollTrigger: 항목 상단이 뷰포트 70%선을 지날 때 활성화
  useEffect(() => {
    ScrollTrigger.getAll().forEach((t) => t.kill());
    itemRefs.current = itemRefs.current.slice(0, items.length);

    itemRefs.current.forEach((el, index) => {
      if (!el) return;

      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        end: "top 65%",
        markers: false,
        onEnter: () => {
          if (enableSound) playTick();
          setActiveIndex(index % projects.length);
          setActiveItemIndex(index);
        },
        onEnterBack: () => {
          if (enableSound) playTick();
          setActiveIndex(index % projects.length);
          setActiveItemIndex(index);
        },
      });

      gsap.to(el, {
        repeat: 1,
        yoyo: true,
        ease: "none",
        scrollTrigger: {
          scroller: containerRef.current,
          trigger: el,
          start: "center bottom",
          end: "center top",
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [items, projects.length, playTick, enableSound]);

  const active = projects[activeIndex];

  return (
    <motion.div
      ref={containerRef}
      className={cn("archive w-screen", className)}
      style={{ backgroundColor: active?.bgColor, minHeight: "100vh" }}
      animate={{ backgroundColor: active?.bgColor }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="relative">
        {showPreview && (
          <div className="fixed bottom-10 right-10 z-50 hidden md:block">
            <motion.div
              drag
              className={cn(
                "overflow-hidden rounded-3xl shadow-2xl",
                previewSizeClass[previewSize],
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={active?.image}
                alt={active?.name}
                className="pointer-events-none h-full w-full object-cover"
              />
            </motion.div>
          </div>
        )}

        <div className="flex flex-col gap-6 whitespace-nowrap">
          {items.map((item, index) => {
            const isActive = index === activeItemIndex;
            return (
              <div
                key={`${item.id}-${index}`}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className="project-item z-[5] w-full py-2 transition-opacity duration-300 hover:opacity-100"
                style={{ opacity: isActive ? 1 : 0.2 }}
              >
                <div className="mx-auto w-full">
                  <div className="flex w-full cursor-pointer items-center justify-between gap-6 px-10 text-black lg:justify-start">
                    <h1 className="font-pp-mori text-4xl tracking-[-0.05em] md:text-7xl">
                      {item.name}
                    </h1>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                      {item.badge}
                    </span>
                    <p className="hidden text-sm md:block">[01 sep]</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

/** 데모 데이터: 원본 skiper24 와 동일한 12개 프로젝트 (이미지는 소비측 public/images/x.com/ 기준) */
export const demoProjects: Project[] = [
  { id: 0, name: "Aarzoo", description: "A collection of timeless design elements that bridge the past and present", badge: "Print Design", bgColor: "#ff0000", image: "/images/x.com/20.jpeg" },
  { id: 1, name: "Lost Horizons", description: "Exploring the boundaries of conceptual art and digital expression", badge: "Concept Art", bgColor: "#fff", image: "/images/x.com/21.jpeg" },
  { id: 2, name: "Eternal Echoes", description: "Typography that speaks volumes through minimalist elegance", badge: "Typography", bgColor: "#8b5cf6", image: "/images/x.com/3.jpeg" },
  { id: 3, name: "Abstract Dimensions", description: "Pushing the limits of experimental media and digital art", badge: "Experimental Media", bgColor: "#E5389B", image: "/images/x.com/4.jpeg" },
  { id: 4, name: "Silent Stories", description: "Capturing moments that tell stories without words", badge: "Photography", bgColor: "#06b6d4", image: "/images/x.com/5.jpeg" },
  { id: 5, name: "Fading Memories", description: "Editorial design that preserves the essence of fleeting moments", badge: "Editorial Design", bgColor: "#10b981", image: "/images/x.com/6.jpeg" },
  { id: 6, name: "Weekend", description: "Sound design that creates immersive auditory experiences", badge: "Sound Design", bgColor: "#ADCABA", image: "/images/x.com/19.jpeg" },
  { id: 7, name: "Shattered Glass", description: "Art installations that challenge perception and reality", badge: "Art Installations", bgColor: "#fff", image: "/images/x.com/28.jpeg" },
  { id: 8, name: "Timeless Essence", description: "Brand strategy that creates lasting impressions", badge: "Brand Strategy", bgColor: "#F02D05", image: "/images/x.com/9.jpeg" },
  { id: 9, name: "Parallel Worlds", description: "UX/UI design that transports users to new digital realms", badge: "UX/UI Design", bgColor: "#8b5cf6", image: "/images/x.com/10.jpeg" },
  { id: 10, name: "Invisible Threads", description: "Fashion styling that weaves stories through fabric and form", badge: "Fashion Styling", bgColor: "#fff", image: "/images/x.com/11.jpeg" },
  { id: 11, name: "Beyond the Surface", description: "Augmented reality experiences that transcend physical boundaries", badge: "Augmented Reality", bgColor: "#14b8a6", image: "/images/x.com/12.jpeg" },
];

/** 데모 래퍼: 원본 데이터로 바로 렌더 */
export const Skiper24 = () => <TikTikColorList projects={demoProjects} />;

export default TikTikColorList;
