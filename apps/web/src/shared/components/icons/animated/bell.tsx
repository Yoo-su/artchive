"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";

import {
  type AnimatedIconProps,
  getVariants,
  IconWrapper,
  useAnimateIconContext,
} from "./core";

type BellProps = AnimatedIconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: {
        rotate: 0,
      },
      animate: {
        rotate: [0, 15, -12, 10, -6, 3, 0],
        transformOrigin: "top center",
        transition: { duration: 0.8, ease: "easeInOut" },
      },
    },
    clapper: {
      initial: {
        x: 0,
      },
      animate: {
        x: [0, -4, 4, -3, 2, -1, 0],
        transition: { duration: 0.8, ease: "easeInOut" },
      },
    },
    body: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size = 24, ...props }: BellProps) {
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
        d="M10.268 21a2 2 0 0 0 3.464 0"
        variants={variants.clapper}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
        variants={variants.body}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AnimatedBell(props: BellProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { AnimatedBell, AnimatedBell as BellIcon, type BellProps };
