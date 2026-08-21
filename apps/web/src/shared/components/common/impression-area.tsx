"use client";

import React, { HTMLAttributes, ReactNode, useEffect, useRef } from "react";

import { cn } from "@/shared/utils/cn";

interface ImpressionAreaProps extends HTMLAttributes<HTMLDivElement> {
  onImpression?: () => void;
  threshold?: number | number[];
  rootMargin?: string;
  once?: boolean;
  children?: ReactNode;
}

/**
 * 선언적 뷰포트 감지 컴포넌트 (토스 ImpressionArea 패턴)
 * 명령형 new IntersectionObserver 및 useEffect 보일러플레이트를 선언적으로 추상화합니다.
 */
export function ImpressionArea({
  onImpression,
  threshold = 0.1,
  rootMargin = "0px",
  once = false,
  children,
  className,
  ...props
}: ImpressionAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined" || !onImpression) {
      return;
    }

    if (once && hasTriggeredRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          if (once) {
            hasTriggeredRef.current = true;
            observer.disconnect();
          }
          onImpression();
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [onImpression, threshold, rootMargin, once]);

  return (
    <div ref={containerRef} className={cn(className)} {...props}>
      {children}
    </div>
  );
}
