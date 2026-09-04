"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { type HTMLMotionProps, motion } from "motion/react";
import * as React from "react";

import { useControlledState } from "@/shared/hooks/use-controlled-state";
import { cn, getStrictContext } from "@/shared/utils/index";

type CheckboxContextType = {
  isChecked: boolean | "indeterminate";
  setIsChecked: (checked: boolean | "indeterminate") => void;
};

const [CheckboxProvider, useCheckbox] =
  getStrictContext<CheckboxContextType>("CheckboxContext");

type CheckboxProps = Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Root>,
  "asChild"
> &
  Omit<HTMLMotionProps<"button">, "ref">;

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  name,
  value,
  ...props
}: CheckboxProps) {
  const [isChecked, setIsChecked] = useControlledState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  });

  return (
    <CheckboxProvider value={{ isChecked, setIsChecked }}>
      <CheckboxPrimitive.Root
        checked={isChecked}
        onCheckedChange={setIsChecked}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        asChild
      >
        <motion.button
          data-slot="checkbox"
          type="button"
          role="checkbox"
          aria-checked={
            isChecked === "indeterminate" ? "mixed" : Boolean(isChecked)
          }
          disabled={disabled}
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className={cn(
            "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer inline-flex items-center justify-center",
            className,
          )}
          {...props}
        >
          <CheckboxIndicator />
        </motion.button>
      </CheckboxPrimitive.Root>
    </CheckboxProvider>
  );
}

function CheckboxIndicator() {
  const { isChecked } = useCheckbox();

  return (
    <CheckboxPrimitive.Indicator forceMount asChild>
      <motion.svg
        data-slot="checkbox-indicator"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="3.5"
        stroke="currentColor"
        className="size-3 text-current"
        initial="unchecked"
        animate={isChecked ? "checked" : "unchecked"}
      >
        {isChecked === "indeterminate" ? (
          <motion.line
            x1="4"
            y1="12"
            x2="20"
            y2="12"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: 1,
              transition: { duration: 0.2 },
            }}
          />
        ) : (
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
            variants={{
              checked: {
                pathLength: 1,
                opacity: 1,
                transition: {
                  duration: 0.2,
                  ease: "easeOut",
                },
              },
              unchecked: {
                pathLength: 0,
                opacity: 0,
                transition: {
                  duration: 0.15,
                },
              },
            }}
          />
        )}
      </motion.svg>
    </CheckboxPrimitive.Indicator>
  );
}

export { Checkbox, CheckboxIndicator, type CheckboxProps, useCheckbox };
