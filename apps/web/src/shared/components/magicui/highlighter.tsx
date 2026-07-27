"use client";

import React from "react";

import { cn } from "@/shared/utils/index";

interface HighlighterProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  action?: "underline" | "highlight" | "box";
  color?: string;
  className?: string;
}

/**
 * Magic UI - Highlighter Component
 * Supports 'underline', 'highlight', and 'box' styles
 */
export function Highlighter({
  children,
  action = "underline",
  color = "#FF9800",
  className,
  ...props
}: HighlighterProps) {
  return (
    <span className={cn("relative inline-block", className)} {...props}>
      <span className="relative z-10">{children}</span>

      {action === "underline" && (
        <svg
          className="absolute -bottom-1.5 left-0 w-full h-2.5 overflow-visible pointer-events-none z-0"
          viewBox="0 0 200 12"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 3 7 C 50 11, 150 4, 197 8 C 130 11, 70 8, 3 7"
            fill={color}
            opacity="0.85"
          />
        </svg>
      )}

      {action === "highlight" && (
        <span
          className="absolute inset-0 rounded-md -z-10 opacity-25"
          style={{ backgroundColor: color }}
        />
      )}

      {action === "box" && (
        <span
          className="absolute inset-0 border-2 rounded-md -z-10 opacity-75"
          style={{ borderColor: color }}
        />
      )}
    </span>
  );
}
