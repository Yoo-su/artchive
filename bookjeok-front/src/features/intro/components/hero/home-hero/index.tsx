"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/shared/utils/cn";

const EDITORIAL_CONTENT = [
  {
    kicker: "01 / Discovery",
    title: "낯선 세계로의 초대",
    description:
      "한 권의 책은 그 자체로 하나의 완전한 우주입니다.\n우리는 매일 책장 너머의 새로운 여행을 떠납니다.",
  },
  {
    kicker: "02 / Archive",
    title: "시간이 머무는 곳",
    description:
      "누군가의 손길이 닿았던 책에는 온기가 남아있습니다.\n당신의 서재에 새로운 시간의 층을 쌓아보세요.",
  },
  {
    kicker: "03 / Connection",
    title: "문장으로 맺어지다",
    description:
      "같은 문장을 읽고 같은 감동을 나누는 순간,\n우리는 서로에게 조금 더 다가갑니다.",
  },
];

export const HomeHero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % EDITORIAL_CONTENT.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative flex min-h-[360px] w-full flex-col justify-between py-10 md:min-h-[440px]">
      <div className="flex flex-1 flex-col justify-center px-1 md:px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col gap-5 md:gap-7"
          >
            {/* Kicker (Small Label) */}
            <motion.div
              variants={kickerVariants}
              className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase md:text-xs"
            >
              {EDITORIAL_CONTENT[current].kicker}
            </motion.div>

            {/* Main Title (Kinetic Typography) */}
            {/* max-w-4xl 컨테이너 대응: 폰트 사이즈 조정 및 break-keep 적용 */}
            <div className="overflow-hidden py-1">
              <motion.h1
                variants={titleVariants}
                className={cn(
                  "break-keep text-5xl font-medium leading-[1.15] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl",
                  "font-(family-name:--font-gowun-batang)",
                )}
              >
                {EDITORIAL_CONTENT[current].title}
              </motion.h1>
            </div>

            {/* Description (Editorial Layout) */}
            <div className="flex justify-end pt-2 pr-2 md:pr-12 lg:pr-24">
              <motion.p
                variants={descVariants}
                className="max-w-sm break-keep whitespace-pre-line text-right text-sm leading-relaxed text-muted-foreground sm:max-w-md md:text-base lg:text-lg"
              >
                {EDITORIAL_CONTENT[current].description}
              </motion.p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Unique Progress Divider */}
      <div className="relative mt-10 h-px w-full bg-border/60 md:mt-14">
        <motion.div
          layoutId="progress"
          className="absolute left-0 top-0 h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 6, ease: "linear", repeat: Infinity }}
        />
      </div>
    </section>
  );
};

// Animations
const kickerVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

const titleVariants: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  exit: { y: "-100%", transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const descVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};
