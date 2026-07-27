"use client";

import React from "react";

import { cn } from "@/shared/utils/index";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Magic UI - Shine Border
 * Corrected pseudo-element positioning & warm vibrant palette
 */
export function ShineBorder({
  borderRadius = 16,
  borderWidth = 1.5,
  duration = 8,
  color = ["#f59e0b", "#fbbf24", "#34d399"], // Warm amber gold & soft emerald
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
        } as React.CSSProperties
      }
      className={cn(
        "relative w-full rounded-[var(--border-radius)]",
        className,
      )}
    >
      <div
        style={
          {
            "--border-width": `${borderWidth}px`,
            "--border-radius": `${borderRadius}px`,
            "--duration": `${duration}s`,
            "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
            "--background-radial-gradient": `radial-gradient(transparent, transparent, ${
              Array.isArray(color) ? color.join(",") : color
            }, transparent, transparent)`,
          } as React.CSSProperties
        }
        className="pointer-events-none absolute -inset-[var(--border-width)] rounded-[var(--border-radius)] p-[var(--border-width)] will-change-[background-position] before:content-[''] before:absolute before:inset-0 before:rounded-[var(--border-radius)] before:p-[var(--border-width)] before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:[mask:var(--mask-linear-gradient)] before:![-webkit-mask-composite:xor] before:![mask-composite:exclude] motion-safe:before:animate-shine z-10"
      />
      {children}
    </div>
  );
}
