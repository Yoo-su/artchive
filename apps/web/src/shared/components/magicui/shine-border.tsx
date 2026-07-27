"use client";

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
 * Magic UI - Shine Border (Dark Gray / Stone Neutral Metallic Sheen)
 */
export function ShineBorder({
  borderRadius = 16,
  borderWidth = 1,
  duration = 10,
  color = ["#52525b", "#a1a1aa", "#3f3f46"], // Elegant dark stone/zinc gray palette
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
            "--background-radial-gradient": `radial-gradient(transparent,transparent, ${
              Array.isArray(color) ? color.join(",") : color
            },transparent,transparent)`,
          } as React.CSSProperties
        }
        className="pointer-events-none absolute -inset-[var(--border-width)] rounded-[var(--border-radius)] p-[var(--border-width)] will-change-[background-position] content-[''] ![-webkit-mask-composite:xor] ![mask-composite:exclude] [background-image:var(--background-radial-gradient)] [background-size:300%_300%] [mask:var(--mask-linear-gradient)] motion-safe:animate-shine z-10"
      />
      {children}
    </div>
  );
}
