"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import React from "react";

import { cn } from "@/shared/utils/cn";

export interface ScrollProgressProps {
  className?: string;
}

export function ScrollProgress({ className }: ScrollProgressProps) {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 50,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className={cn(
        "fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-gradient-to-r from-stone-900 via-stone-600 to-stone-400 dark:from-stone-100 dark:via-stone-300 dark:to-stone-500",
        className,
      )}
      style={{
        scaleX,
      }}
    />
  );
}
