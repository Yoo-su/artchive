"use client";

import React from "react";

import { cn } from "@/shared/utils/index";

interface LightRaysProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Magic UI - Light Rays Background Component
 * Soft stone/neutral light rays radiating from the top center
 */
export function LightRays({ className, ...props }: LightRaysProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-50 select-none",
        className,
      )}
      {...props}
    >
      <svg
        className="absolute -top-[25%] left-1/2 -translate-x-1/2 w-[150%] h-[150%] pointer-events-none"
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g opacity="0.6" filter="url(#blur-rays)">
          <path d="M500 0 L100 1000 L240 1000 Z" fill="url(#ray-grad-1)" />
          <path d="M500 0 L320 1000 L440 1000 Z" fill="url(#ray-grad-2)" />
          <path d="M500 0 L560 1000 L680 1000 Z" fill="url(#ray-grad-1)" />
          <path d="M500 0 L760 1000 L900 1000 Z" fill="url(#ray-grad-2)" />
        </g>
        <defs>
          <filter id="blur-rays" x="0" y="0" width="1000" height="1000" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="32" />
          </filter>
          <linearGradient id="ray-grad-1" x1="500" y1="0" x2="500" y2="1000" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a1a1aa" stopOpacity="0.3" />
            <stop offset="1" stopColor="#e4e4e7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ray-grad-2" x1="500" y1="0" x2="500" y2="1000" gradientUnits="userSpaceOnUse">
            <stop stopColor="#71717a" stopOpacity="0.25" />
            <stop offset="1" stopColor="#d4d4d8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
