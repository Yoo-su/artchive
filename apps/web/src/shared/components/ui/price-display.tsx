import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/shared/utils/cn";

interface PriceDisplayProps {
  value: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const PriceDisplay = ({
  value,
  currency = "KRW",
  size = "md",
  className,
}: PriceDisplayProps) => {
  const locale = useLocale();
  const t = useTranslations("common");
  const formattedValue = new Intl.NumberFormat(
    locale === "en" ? "en-US" : "ko-KR",
  ).format(value);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg font-bold",
    xl: "text-3xl font-extrabold",
  };

  const isKRW = currency === "KRW";

  return (
    <span
      className={cn("font-medium text-gray-900", sizeClasses[size], className)}
    >
      {locale === "en" && isKRW ? `₩${formattedValue}` : formattedValue}
      {locale !== "en" && (
        <span className="ml-0.5 text-sm font-normal text-gray-600">
          {isKRW ? t("currency.unit") : currency}
        </span>
      )}
      {locale === "en" && !isKRW && (
        <span className="ml-0.5 text-sm font-normal text-gray-600">
          {currency}
        </span>
      )}
    </span>
  );
};
