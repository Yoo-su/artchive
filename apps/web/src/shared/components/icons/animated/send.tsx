"use client";

import { motion, type Variants } from "motion/react";
import * as React from "react";

import {
  type AnimatedIconProps,
  getVariants,
  IconWrapper,
  useAnimateIconContext,
} from "./core";

type SendProps = AnimatedIconProps<keyof typeof animations>;

const animations = {
  default: {
    group: {
      initial: {
        x: 0,
        y: 0,
        rotate: 0,
      },
      animate: {
        x: [0, 4, -2, 0],
        y: [0, -4, 2, 0],
        rotate: [0, -8, 4, 0],
        transition: { duration: 0.5, ease: "easeInOut" },
      },
    },
    plane: {
      initial: { scale: 1 },
      animate: {
        scale: [1, 1.15, 0.95, 1],
        transition: { duration: 0.5, ease: "easeInOut" },
      },
    },
  } satisfies Record<string, Variants>,
  shoot: {
    group: {
      initial: {
        x: 0,
        y: 0,
        scale: 1,
      },
      animate: {
        x: [0, 6, -3, 0],
        y: [0, -6, 3, 0],
        scale: [1, 1.2, 0.9, 1],
        transition: { duration: 0.4, ease: "easeOut" },
      },
    },
    plane: {},
  } satisfies Record<string, Variants>,
} as const;

function IconComponent({ size = 20, ...props }: SendProps) {
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
        d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"
        variants={variants.plane}
        initial="initial"
        animate={controls}
      />
      <motion.path
        d="M6 12h16"
        variants={variants.plane}
        initial="initial"
        animate={controls}
      />
    </motion.svg>
  );
}

function AnimatedSend(props: SendProps) {
  return <IconWrapper icon={IconComponent} {...props} />;
}

export { AnimatedSend, AnimatedSend as SendIcon, type SendProps };
