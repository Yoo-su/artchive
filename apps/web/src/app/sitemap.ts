import { MetadataRoute } from "next";

import { searchBookSales } from "@/features/book-sale/apis";
import { getReviews } from "@/features/review/apis";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bookjeok.com";
  const locales = ["ko", "en"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    // 1. 정적 라우트
    sitemapEntries.push(
      {
        url: `${baseUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/${locale}/book/market`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/${locale}/book/reviews`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/${locale}/book/search`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
    );

    // 2. 동적 라우트: 리뷰
    try {
      const { reviews } = await getReviews({ page: 1, limit: 50 });
      reviews.forEach((review) => {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/book/reviews/${review.id}`,
          lastModified: new Date(review.updatedAt),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      });
    } catch (error) {
      console.error(`Failed to fetch reviews for sitemap (${locale}):`, error);
    }

    // 3. 동적 라우트: 판매글
    try {
      const { sales } = await searchBookSales({ page: 1, limit: 50 });
      sales.forEach((sale) => {
        sitemapEntries.push({
          url: `${baseUrl}/${locale}/book/sales/${sale.id}`,
          lastModified: sale.updatedAt ? new Date(sale.updatedAt) : new Date(),
          changeFrequency: "daily",
          priority: 0.7,
        });
      });
    } catch (error) {
      console.error(`Failed to fetch sales for sitemap (${locale}):`, error);
    }
  }

  return sitemapEntries;
}
