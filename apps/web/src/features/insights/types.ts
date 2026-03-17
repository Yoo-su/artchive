/**
 * 서비스 인사이트 타입 정의
 * 백엔드 DTO와 일치합니다.
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
export interface LocationSales {
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
  range: string;
  min: number;
  max: number;
  count: number;
}

// 일별 활동 추이
export interface ActivityTrendStat {
  date: string;
  salesCount: number;
  reviewsCount: number;
}

// 리액션 타입별 집계
export interface ReactionStat {
  type: string;
  count: number;
}

// 인기 태그
export interface PopularTagStat {
  name: string;
  count: number;
}

// 전체 인사이트 응답
export interface InsightsResponse {
  locationStats: LocationStat[];
  categoryStats: CategoryStat[];
  priceDistribution: PriceRangeStat[];
  activityTrend: ActivityTrendStat[];
  reactionStats: ReactionStat[];
  popularTags: PopularTagStat[];
  summary: {
    totalSales: number;
    totalReviews: number;
    totalReactions: number;
    totalTags: number;
  };
}
