import { MetadataRoute } from "next";

import { getBookSales } from "@/features/book-sale/apis";
import { getReviews } from "@/features/review/apis";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://bookjeok.com";
  const defaultLocale = "ko";

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. 정적 라우트
  const staticPaths = [
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/book/market", changeFrequency: "hourly" as const, priority: 0.9 },
    { path: "/book/reviews", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/book/search", changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  staticPaths.forEach(({ path, changeFrequency, priority }) => {
    sitemapEntries.push({
      url: `${baseUrl}/${defaultLocale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: {
        languages: {
          ko: `${baseUrl}/ko${path}`,
          en: `${baseUrl}/en${path}`,
        },
      },
    });
  });

  // 2. 동적 라우트: 리뷰
  try {
    const { reviews } = await getReviews({ page: 1, limit: 50 });
    reviews.forEach((review) => {
      sitemapEntries.push({
        url: `${baseUrl}/${defaultLocale}/book/reviews/${review.id}`,
        lastModified: new Date(review.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko/book/reviews/${review.id}`,
            en: `${baseUrl}/en/book/reviews/${review.id}`,
          },
        },
      });
    });
  } catch (error) {
    console.error("Failed to fetch reviews for sitemap:", error);
  }

  // 3. 동적 라우트: 판매글
  try {
    const { sales } = await getBookSales({ page: 1, limit: 50 });
    sales.forEach((sale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${defaultLocale}/book/sales/${sale.id}`,
        lastModified: sale.updatedAt ? new Date(sale.updatedAt) : new Date(),
        changeFrequency: "daily",
        priority: 0.7,
        alternates: {
          languages: {
            ko: `${baseUrl}/ko/book/sales/${sale.id}`,
            en: `${baseUrl}/en/book/sales/${sale.id}`,
          },
        },
      });
    });
  } catch (error) {
    console.error("Failed to fetch sales for sitemap:", error);
  }

  return sitemapEntries;
}
