"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";

import {
  type AnimatedIconProps,
  getVariants,
  IconWrapper,
  useAnimateIconContext,
} from "./core";

type BookmarkProps = AnimatedIconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: {
        scale: 1,
        y: 0,
      },
      animate: {
        scale: [1, 0.9, 1.15, 1],
        y: [0, -2, 1, 0],
        transition: { duration: 0.45, ease: "easeOut" },
      },
    },
    path: {},
  } satisfies Record<string, Variants>,
  fill: {
    group: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 0.85, 1.2, 1],
        transition: { duration: 0.45, ease: "easeOut" },
      },
    },
    path: {
      initial: {
        fill: "currentColor",
        fillOpacity: 0,
      },
      animate: {
        fillOpacity: 1,
        transition: { delay: 0.1, duration: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size = 24, ...props }: BookmarkProps) {
  const { controls } = useAnimateIconContext();
  const variants = getVariants(animations);

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={variants.group}
      initial="initial"
      animate={controls}
      className="shrink-0"
      {...props}
    >
      <motion.path
        d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AnimatedBookmark(props: BookmarkProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { AnimatedBookmark, AnimatedBookmark as BookmarkIcon, type BookmarkProps };
