"use client";

import { AnimatePresence, motion, type SVGMotionProps } from "motion/react";
import * as React from "react";

import { cn } from "@/shared/utils/index";

interface CopyCheckIconProps
  extends Omit<
    SVGMotionProps<SVGSVGElement>,
    "animate" | "initial" | "exit" | "transition"
  > {
  copied?: boolean;
  size?: number | string;
  className?: string;
}

export function AnimatedCopyCheck({
  copied = false,
  size = 18,
  className,
  ...props
}: CopyCheckIconProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.svg
            key="check"
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            className="text-emerald-600 dark:text-emerald-400"
            {...props}
          >
            <motion.polyline
              points="20 6 9 17 4 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="copy"
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            {...props}
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </motion.svg>
        )}
      </AnimatePresence>
    </span>
  );
}
