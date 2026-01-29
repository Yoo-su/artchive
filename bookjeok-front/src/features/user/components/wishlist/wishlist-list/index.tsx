"use client";

import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

import { useWishlistQuery } from "@/features/user/queries";
import { Button } from "@/shared/components/shadcn/button";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { WishlistItem } from "../wishlist-item";
import { WishlistSkeleton } from "./skeleton";

/**
 * 위시리스트 목록을 보여주는 컴포넌트입니다.
 * 내부에서 useWishlistQuery를 호출하여 데이터를 가져옵니다.
 */
export const WishlistList = () => {
  const t = useTranslations("wishlist.empty");
  const { data: wishlist, isLoading } = useWishlistQuery();

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Heart className="mb-4 h-16 w-16 text-gray-200" />
        <h2 className="text-xl font-semibold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-gray-500">{t("desc")}</p>
        <Button asChild className="mt-6">
          <Link href={PATHS.HOME}>{t("button")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {wishlist.map((item) => (
        <WishlistItem key={item.id} item={item} />
      ))}
    </div>
  );
};
