import type { UseInViewOptions } from "motion/react";
import * as React from "react";

interface UseIsInViewOptions {
  inView?: boolean;
  inViewOnce?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
}

function useIsInView<T extends HTMLElement = HTMLElement>(
  ref: React.Ref<T>,
  options: UseIsInViewOptions = {},
) {
  const { inView = false, inViewOnce = false, inViewMargin = "0px" } = options;
  const localRef = React.useRef<T>(null);
  React.useImperativeHandle(ref, () => localRef.current as T);
  const [isInView, setIsInView] = React.useState(!inView);

  React.useEffect(() => {
    if (!inView) {
      setIsInView(true);
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      setIsInView(true);
      return;
    }

    const node = localRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inViewStatus = entry?.isIntersecting ?? false;
        setIsInView(inViewStatus);
        if (inViewStatus && inViewOnce) {
          observer.disconnect();
        }
      },
      {
        rootMargin: typeof inViewMargin === "string" ? inViewMargin : undefined,
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [inView, inViewOnce, inViewMargin]);

  return { ref: localRef, isInView };
}

export { useIsInView, type UseIsInViewOptions };
