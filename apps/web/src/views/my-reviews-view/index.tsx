"use client";

import { useTranslations } from "next-intl";

import { MyReviewList } from "@/features/review/components/review-list/my-review-list";

export default function MyReviewsPage() {
  const t = useTranslations("my_reviews");

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>
      <MyReviewList />
    </div>
  );
}
