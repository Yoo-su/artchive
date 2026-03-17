"use client";

import { useTranslations } from "next-intl";

import { WishlistList } from "@/features/user/components/wishlist/wishlist-list";

export const WishlistView = () => {
  const t = useTranslations("wishlist");

  return (
    <div>
      <h1 className="mb-6 py-4 text-2xl font-bold">{t("title")}</h1>
      <WishlistList />
    </div>
  );
};
