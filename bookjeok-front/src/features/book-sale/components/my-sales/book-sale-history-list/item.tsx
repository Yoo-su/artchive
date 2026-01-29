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
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import {
  useDeleteBookSaleMutation,
  useUpdateBookSaleStatusMutation,
} from "../../../mutations";
import { SaleStatus, UsedBookSale } from "../../../types";
import { SaleStatusBadge } from "../../common/sale-status-badge";

interface BookSaleHistoryItemProps {
  sale: UsedBookSale;
}
export const BookSaleHistoryItem = ({ sale }: BookSaleHistoryItemProps) => {
  const t = useTranslations("market.history");
  const tStatus = useTranslations("market.sale_status");
  const tActions = useTranslations("market.detail.actions");

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

  return (
    <Link href={PATHS.BOOK_SALES_DETAIL(String(sale.id))} passHref>
      <Card className="transition-shadow duration-300 hover:shadow-md cursor-pointer">
        <CardContent className="flex items-center p-4 gap-4">
          <div className="relative w-20 h-28 shrink-0">
            <Image
              src={sale.book.image ?? "/placeholder.jpg"}
              alt={sale.book.title}
              fill
              sizes="80px"
              className="rounded-md object-cover"
            />
          </div>
          <div className="grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="grow w-0">
                <SaleStatusBadge status={sale.status} />
                <h3 className="font-semibold text-lg mt-1 truncate">
                  {sale.title}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {sale.book.title}
                </p>
              </div>
              <div onClick={handleDropdownClick}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>{tActions("edit")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>
                        {isDeleting ? tActions("deleting") : tActions("delete")}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="font-bold text-gray-800">
                {sale.price.toLocaleString()}원
              </p>
              <div onClick={handleDropdownClick}>
                <Select value={sale.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue placeholder={t("change_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SaleStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {tStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
