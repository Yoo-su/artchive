/**
 * 서비스 인사이트 응답 DTO
 * 전체 서비스 통계 데이터를 반환합니다.
 */

// 지역별 거래 현황
export interface LocationStat {
  city: string;
  district: string;
  count: number;
  latitude: number;
  longitude: number;
}

// 지역별 판매글 정보 (마커용)
export class LocationSalesDto {
  id: number;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  placeName: string;
  bookTitle: string;
}

// 카테고리별 리뷰 수
export interface CategoryStat {
  category: string;
  count: number;
}

// 가격 구간별 판매글 수
export interface PriceRangeStat {
  range: string; // 예: "0-5000", "5000-10000"
  min: number;
  max: number;
  count: number;
}

// 일별 활동 추이
export interface ActivityTrendStat {
  date: string; // YYYY-MM-DD
  salesCount: number;
  reviewsCount: number;
}

// 리액션 타입별 집계
export interface ReactionStat {
  type: string; // LIKE, INSIGHTFUL, SUPPORT
  count: number;
}

// 인기 태그
export interface PopularTagStat {
  name: string;
  count: number;
}

// 전체 인사이트 응답
export class InsightsResponseDto {
  // 지역별 거래 현황 (위치 포함)
  locationStats: LocationStat[];

  // 카테고리별 리뷰 수
  categoryStats: CategoryStat[];

  // 가격 구간별 판매글 수
  priceDistribution: PriceRangeStat[];

  // 최근 30일 일별 활동 추이
  activityTrend: ActivityTrendStat[];

  // 리액션 타입별 집계
  reactionStats: ReactionStat[];

  // 인기 태그 Top 20
  popularTags: PopularTagStat[];

  // 요약 통계
  summary: {
    totalSales: number;
    totalReviews: number;
    totalReactions: number;
    totalTags: number;
  };
}
