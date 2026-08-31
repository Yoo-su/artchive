"use client";

import { AnimatePresence, type HTMLMotionProps, motion } from "motion/react";
import * as React from "react";

import { Slot, type WithAsChild } from "@/shared/components/shadcn/slot";
import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { cn, getStrictContext } from "@/shared/utils/index";

type TabsContextType = {
  activeValue: string;
  setActiveValue: (value: string) => void;
  uniqueId: string;
};

const [TabsProvider, useTabs] =
  getStrictContext<TabsContextType>("TabsContext");

interface TabsProps extends React.ComponentProps<"div"> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: TabsProps) {
  const [activeValue, setActiveValue] = useControlledState({
    value,
    defaultValue: defaultValue ?? "",
    onChange: onValueChange,
  });

  const uniqueId = React.useId();

  return (
    <TabsProvider value={{ activeValue, setActiveValue, uniqueId }}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsProvider>
  );
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground relative inline-flex h-9 w-fit items-center justify-center rounded-lg p-1 select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = WithAsChild<
  {
    value: string;
    children: React.ReactNode;
  } & Omit<HTMLMotionProps<"button">, "ref">
>;

function TabsTrigger({
  value,
  className,
  children,
  asChild = false,
  ...props
}: TabsTriggerProps) {
  const { activeValue, setActiveValue, uniqueId } = useTabs();
  const isActive = activeValue === value;
  const Component = asChild ? Slot : motion.button;

  return (
    <Component
      role="tab"
      type="button"
      data-slot="tabs-trigger"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setActiveValue(value)}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className={cn(
        "relative z-10 inline-flex h-[calc(100%-2px)] flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive
          ? "text-foreground font-semibold"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.div
          layoutId={`active-tab-${uniqueId}`}
          data-slot="tabs-active-indicator"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-background text-foreground absolute inset-0 z-[-1] rounded-md shadow-xs"
        />
      )}
      <span className="relative z-10">{children}</span>
    </Component>
  );
}

interface TabsContentProps extends HTMLMotionProps<"div"> {
  value: string;
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { activeValue } = useTabs();
  const isActive = activeValue === value;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          role="tabpanel"
          data-slot="tabs-content"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn("outline-none", className)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export {
  Tabs,
  TabsContent,
  type TabsContentProps,
  TabsList,
  type TabsProps,
  TabsTrigger,
  type TabsTriggerProps,
  useTabs,
};
