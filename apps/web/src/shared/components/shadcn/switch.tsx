"use client";

import * as SwitchPrimitives from "@radix-ui/react-switch";
import { type HTMLMotionProps, motion } from "motion/react";
import * as React from "react";

import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { cn, getStrictContext } from "@/shared/utils/index";

type SwitchContextType = {
  isChecked: boolean;
  setIsChecked: (isChecked: boolean) => void;
  isPressed: boolean;
  setIsPressed: (isPressed: boolean) => void;
};

const [SwitchProvider, useSwitch] =
  getStrictContext<SwitchContextType>("SwitchContext");

type SwitchProps = Omit<
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
  "asChild"
> &
  Omit<HTMLMotionProps<"button">, "ref"> & {
    pressedWidth?: number;
  };

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      pressedWidth = 20,
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const [isChecked, setIsChecked] = useControlledState({
      value: checked,
      defaultValue: defaultChecked,
      onChange: onCheckedChange,
    });

    return (
      <SwitchProvider
        value={{ isChecked, setIsChecked, isPressed, setIsPressed }}
      >
        <SwitchPrimitives.Root
          ref={ref}
          checked={isChecked}
          onCheckedChange={setIsChecked}
          disabled={disabled}
          asChild
          {...props}
        >
          <motion.button
            data-slot="switch"
            type="button"
            role="switch"
            aria-checked={isChecked}
            disabled={disabled}
            onTapStart={() => !disabled && setIsPressed(true)}
            onTapCancel={() => setIsPressed(false)}
            onTap={() => setIsPressed(false)}
            className={cn(
              "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input dark:data-[state=unchecked]:bg-input/80 p-0.5",
              className
            )}
          >
            <SwitchPrimitives.Thumb asChild>
              <motion.span
                data-slot="switch-thumb"
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                animate={{
                  width: isPressed ? pressedWidth : 16,
                }}
                className={cn(
                  "pointer-events-none block h-4 w-4 rounded-full bg-background dark:bg-foreground shadow-sm ring-0 data-[state=checked]:ml-auto data-[state=unchecked]:mr-auto"
                )}
              />
            </SwitchPrimitives.Thumb>
          </motion.button>
        </SwitchPrimitives.Root>
      </SwitchProvider>
    );
  }
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch, type SwitchProps, useSwitch };
