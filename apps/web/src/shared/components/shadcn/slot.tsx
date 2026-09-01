"use client";

import { type HTMLMotionProps, isMotionComponent, motion } from "motion/react";
import * as React from "react";

import { cn } from "@/shared/utils/index";

type AnyProps = Record<string, unknown>;

type DOMMotionProps<T extends HTMLElement = HTMLElement> = Omit<
  HTMLMotionProps<keyof HTMLElementTagNameMap>,
  "ref"
> & { ref?: React.Ref<T> };

type WithAsChild<Base extends object> =
  | (Base & { asChild: true; children: React.ReactElement })
  | (Base & { asChild?: false | undefined });

type SlotProps<T extends HTMLElement = HTMLElement> = {
   
  children?: any;
} & DOMMotionProps<T>;

const REACT_LAZY_TYPE = Symbol.for("react.lazy");

type LazyElement = { _payload: PromiseLike<React.ReactElement> };

/**
 * 서버 컴포넌트에서 `asChild`로 전달된 children은 클라이언트 경계를 넘으면서
 * react.lazy 참조로 도착합니다. 이 경우 `.type`이 존재하지 않으므로 먼저 해제해야 합니다.
 */
function isLazyElement(value: unknown): value is LazyElement {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as { $$typeof?: unknown; _payload?: unknown };
  if (candidate.$$typeof !== REACT_LAZY_TYPE) return false;
  return (
    typeof candidate._payload === "object" &&
    candidate._payload !== null &&
    "then" in candidate._payload
  );
}

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.RefObject<T | null>).current = node;
      }
    });
  };
}

function mergeProps<T extends HTMLElement>(
  childProps: AnyProps,
  slotProps: DOMMotionProps<T>
): AnyProps {
  const merged: AnyProps = { ...childProps, ...slotProps };

  if (childProps.className || slotProps.className) {
    merged.className = cn(
      childProps.className as string,
      slotProps.className as string
    );
  }

  if (childProps.style || slotProps.style) {
    merged.style = {
      ...(childProps.style as React.CSSProperties),
      ...(slotProps.style as React.CSSProperties),
    };
  }

  return merged;
}

function Slot<T extends HTMLElement = HTMLElement>({
  children,
  ref,
  ...props
}: SlotProps<T>) {
  // 서버 컴포넌트에서 넘어온 children은 lazy 참조이므로 해제 후 element로 다룬다.
  const resolvedChildren: unknown = isLazyElement(children)
    ? React.use(children._payload)
    : children;

  // children이 유효한 element가 아니면 type이 없으므로 motion.create에 넘기지 않는다.
  const childType = React.isValidElement(resolvedChildren)
    ? (resolvedChildren.type as React.ElementType)
    : null;

  const isAlreadyMotion =
    typeof childType === "object" &&
    childType !== null &&
    isMotionComponent(childType);

  const Base = React.useMemo(() => {
    if (childType === null) return null;
    return isAlreadyMotion ? childType : motion.create(childType);
  }, [isAlreadyMotion, childType]);

  if (!React.isValidElement(resolvedChildren) || Base === null) return null;

  const { ref: childRef, ...childProps } = resolvedChildren.props as AnyProps;

  const mergedProps = mergeProps(childProps, props);

  return (
    <Base {...mergedProps} ref={mergeRefs(childRef as React.Ref<T>, ref)} />
  );
}

export {
  type AnyProps,
  type DOMMotionProps,
  Slot,
  type SlotProps,
  type WithAsChild,
};
