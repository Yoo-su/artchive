import { SaleStatus, UsedBookSale } from "@bookjeok/core/book-sale";
import { Edit, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/components/shadcn/button";
import { Card, CardContent } from "@/shared/components/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/shadcn/select";
import { Link, useRouter } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import {
  useDeleteBookSaleMutation,
  useUpdateBookSaleStatusMutation,
} from "../../../mutations";
import { SaleStatusBadge } from "../../common/sale-status-badge";

interface BookSaleHistoryItemProps {
  sale: UsedBookSale;
}

export const BookSaleHistoryItem = ({ sale }: BookSaleHistoryItemProps) => {
  const t = useTranslations("market.history");
  const tStatus = useTranslations("market.sale_status");
  const tActions = useTranslations("market.detail.actions");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const { mutate: updateSaleStatus } = useUpdateBookSaleStatusMutation();
  const { mutate: deleteSale, isPending: isDeleting } =
    useDeleteBookSaleMutation();

  const handleStatusChange = (newStatus: SaleStatus) => {
    updateSaleStatus({ saleId: sale.id, status: newStatus });
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (window.confirm(tActions("delete_desc"))) {
      deleteSale({ saleId: sale.id, imageUrls: sale.imageUrls });
    }
  };

  const handleDropdownClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };

  const handleCardClick = () => {
    router.push(PATHS.BOOK_SALES_DETAIL(String(sale.id)));
  };

  return (
    <div
      className="group relative flex gap-4 py-6 border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors"
      onClick={handleCardClick}
    >
      {/* 이미지 영역 (4:5 비율) */}
      <div className="relative w-20 aspect-4/5 shrink-0 bg-stone-100 rounded-sm overflow-hidden border border-stone-100">
        <Image
          src={sale.imageUrls[0] || "/images/placeholder-image.svg"}
          alt={sale.title}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* 상태 배지 (이미지 위 오버레이) */}
        <div className="absolute top-1 right-1">
          {/* 공간 절약을 위해 이미지 위에는 텍스트만 띄우거나, 리스트에서는 배지를 콘텐츠 영역으로 이동 */}
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex justify-between items-start gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <SaleStatusBadge
                status={sale.status}
                className="h-5 px-1.5 text-[10px]"
              />
              <span className="text-xs text-stone-400">
                {new Date(sale.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900 line-clamp-1 leading-tight group-hover:text-stone-600 transition-colors">
              {sale.title}
            </h3>
            <p className="text-sm text-stone-500 line-clamp-1">
              {sale.book.title}
            </p>
          </div>

          <div onClick={handleDropdownClick}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-full"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem asChild>
                  <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
                    <Edit className="mr-2 h-3.5 w-3.5" />
                    <span className="text-xs">{tActions("edit")}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  <span className="text-xs">
                    {isDeleting ? tActions("deleting") : tActions("delete")}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-end justify-between mt-3">
          <p className="font-bold text-lg text-stone-900">
            {sale.price.toLocaleString()}
            <span className="text-sm font-normal text-stone-500 ml-0.5">
              {tCommon("won")}
            </span>
          </p>

          <div onClick={handleDropdownClick}>
            <Select value={sale.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[110px] h-8 text-xs bg-white border-stone-200 focus:ring-stone-200 shadow-sm">
                <SelectValue placeholder={t("change_status")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SaleStatus).map((status) => (
                  <SelectItem key={status} value={status} className="text-xs">
                    {tStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};
