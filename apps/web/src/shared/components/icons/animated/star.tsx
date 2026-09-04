"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";

import {
  type AnimatedIconProps,
  getVariants,
  IconWrapper,
  useAnimateIconContext,
} from "./core";

type StarProps = AnimatedIconProps<keyof typeof animations> & {
  filled?: boolean;
  half?: boolean;
};

const animations = {
  default: {
    group: {
      initial: {
        scale: 1,
        rotate: 0,
      },
      animate: {
        scale: [1, 0.8, 1.25, 1],
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.45, ease: "easeOut" },
      },
    },
    path: {},
  } satisfies Record<string, Variants>,
  pop: {
    group: {
      initial: {
        scale: 1,
      },
      animate: {
        scale: [1, 0.85, 1.3, 1],
        transition: { duration: 0.35, ease: "easeOut" },
      },
    },
    path: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({
  size = 24,
  filled = false,
  half = false,
  ...props
}: StarProps) {
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={variants.group}
      initial="initial"
      animate={controls}
      className="shrink-0"
      {...props}
    >
      <motion.path
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.167.751a.53.53 0 0 1 .294.904l-3.739 3.644a2.123 2.123 0 0 0-.611 1.879l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.976 0l-4.618 2.428a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.79a.53.53 0 0 1 .294-.906l5.165-.75a2.122 2.122 0 0 0 1.597-1.16z"
        variants={variants.path}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AnimatedStar(props: StarProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { AnimatedStar, AnimatedStar as StarIcon, type StarProps };
