"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";

import {
  type AnimatedIconProps,
  getVariants,
  IconWrapper,
  useAnimateIconContext,
} from "./core";

type HeartProps = AnimatedIconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 0.85, 1.25, 1],
        transition: { duration: 0.5, ease: "easeInOut" },
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
        scale: [1, 0.85, 1.25, 1],
        transition: { duration: 0.5, ease: "easeInOut" },
      },
    },
    path: {
      initial: {
        fill: "currentColor",
        fillOpacity: 0,
      },
      animate: {
        fillOpacity: 1,
        transition: { delay: 0.15, duration: 0.2 },
      },
    },
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size = 24, ...props }: HeartProps) {
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
        d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AnimatedHeart(props: HeartProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { AnimatedHeart, AnimatedHeart as HeartIcon, type HeartProps };
