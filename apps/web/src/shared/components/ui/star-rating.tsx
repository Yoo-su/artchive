"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { Star } from "@/shared/components/icons/iconsax";
import { cn } from "@/shared/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  className?: string;
  size?: number;
  disabled?: boolean;
}

export const StarRating = ({
  value,
  onChange,
  readonly = false,
  className,
  size = 24,
  disabled = false,
}: StarRatingProps) => {
  const t = useTranslations("common.aria");
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (readonly || disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(index + (isHalf ? 0.5 : 1));
  };

  const handleClick = () => {
    if (readonly || disabled || hoverValue === null) return;
    onChange?.(hoverValue);
  };

  const displayValue = hoverValue ?? value;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readonly || disabled) return;

    let newValue = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      newValue = Math.min(5, value + 0.5);
      onChange?.(newValue);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      newValue = Math.max(0, value - 0.5);
      onChange?.(newValue);
    } else if (e.key === "Home") {
      e.preventDefault();
      newValue = 0;
      onChange?.(0);
    } else if (e.key === "End") {
      e.preventDefault();
      newValue = 5;
      onChange?.(5);
    }
  };

  return (
    <div
      role={readonly || disabled ? undefined : "slider"}
      aria-label={t("rating_select")}
      aria-valuemin={readonly || disabled ? undefined : 0}
      aria-valuemax={readonly || disabled ? undefined : 5}
      aria-valuenow={readonly || disabled ? undefined : value}
      tabIndex={readonly || disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-md p-1 -m-1",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      onMouseLeave={() => setHoverValue(null)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = displayValue >= i + 1;
        const half = displayValue === i + 0.5;

        return (
          <div
            key={i}
            className={cn(
              "relative transition-transform hover:scale-110",
              (readonly || disabled) && "cursor-default hover:scale-100",
              !readonly && !disabled && "cursor-pointer",
            )}
            style={{ width: size, height: size }}
            onMouseMove={(e) => handleMouseMove(e, i)}
            onClick={handleClick}
          >
            <Star
              variant={filled ? "bold" : "outline"}
              className={cn(
                "absolute top-0 left-0 w-full h-full text-stone-200 transition-colors",
                filled && "text-amber-400 drop-shadow-sm",
              )}
              aria-hidden="true"
            />
            {half && (
              <div className="absolute top-0 left-0 w-1/2 h-full overflow-hidden">
                <Star
                  variant="bold"
                  className="w-full h-full text-amber-400 drop-shadow-sm"
                  style={{ width: size, height: size }}
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        );
      })}
      {!readonly && (
        <span className="ml-2 text-sm font-bold text-amber-500 min-w-[3ch]">
          {displayValue > 0 ? displayValue.toFixed(1) : "0.0"}
        </span>
      )}
    </div>
  );
};
