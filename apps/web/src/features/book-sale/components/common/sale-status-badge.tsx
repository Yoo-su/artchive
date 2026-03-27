import { SaleStatus } from "@bookjeok/core/book-sale";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/components/shadcn/badge";
import { cn } from "@/shared/utils/cn";

const STATUS_PRESETS: {
  [key in SaleStatus]: { className: string };
} = {
  FOR_SALE: {
    className: "bg-stone-900 hover:bg-stone-800 text-white border-transparent",
  },
  RESERVED: {
    className: "bg-stone-500 hover:bg-stone-600 text-white border-transparent",
  },
  SOLD: {
    className:
      "bg-stone-200 hover:bg-stone-300 text-stone-500 border-transparent",
  },
};

/**
 * 중고책 판매글의 상태를 표시하는 공용 배지 컴포넌트입니다.
 */
interface SaleStatusBadgeProps {
  status: SaleStatus;
  className?: string; // 추가적인 Tailwind 클래스를 받을 수 있습니다.
}
export const SaleStatusBadge = ({
  status,
  className,
}: SaleStatusBadgeProps) => {
  const t = useTranslations("market.sale_status");
  const preset = STATUS_PRESETS[status] || STATUS_PRESETS.SOLD;

  return (
    <Badge variant="default" className={cn(preset.className, className)}>
      {t(status)}
    </Badge>
  );
};
