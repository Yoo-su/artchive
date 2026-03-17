# Insights Module (`features/insights`)

`InsightsModule`은 bookjeok 서비스의 전체 통계 및 인사이트 데이터를 제공하는 모듈입니다. 지역별 거래 현황, 카테고리별 리뷰 분포, 가격 분포, 활동 추이 등 다양한 통계를 집계합니다.

## 1. 주요 파일 및 역할

- **`insights.controller.ts`**: `/insights` 경로의 API 엔드포인트를 정의합니다.
- **`insights.service.ts`**: 인사이트 관련 비즈니스 로직을 처리합니다.
  - `getInsights`: 전체 인사이트 데이터를 한 번에 조회합니다.
  - `getLocationStats`: 지역별 거래 현황을 조회합니다.
  - `getCategoryStats`: 카테고리별 리뷰 수를 조회합니다.
  - `getPriceDistribution`: 가격 구간별 판매글 분포를 조회합니다.
  - `getActivityTrend`: 최근 30일간 일별 활동 추이를 조회합니다.
  - `getReactionStats`: 리액션 타입별 집계를 조회합니다.
  - `getPopularTags`: 인기 태그 Top 20을 조회합니다.
  - `getSummary`: 요약 통계(전체 판매글, 리뷰, 리액션, 태그 수)를 조회합니다.
  - `getLocationSales`: 특정 지역의 최근 판매글 5개를 조회합니다.
- **`constants.ts`**: 인사이트 관련 상수(가격 구간, 활동 추이 일수 등)를 정의합니다.
- **`dto/insights-response.dto.ts`**: 인사이트 응답 DTO를 정의합니다.

## 2. API 엔드포인트

| HTTP Method | 경로 (`/insights/...`) | 설명                      | 인증 필요 |
| :---------- | :--------------------- | :------------------------ | :-------- |
| `GET`       | `/`                    | 전체 인사이트 데이터 조회 | ❌        |
| `GET`       | `/location-sales`      | 특정 지역 판매글 조회     | ❌        |

## 3. 인사이트 데이터 구조

### `InsightsResponseDto`

전체 인사이트 데이터는 다음 항목들을 포함합니다:

```typescript
{
  summary: {
    totalSales: number;      // 전체 판매글 수
    totalReviews: number;    // 전체 리뷰 수
    totalReactions: number;  // 전체 리액션 수
    totalTags: number;       // 전체 태그 수
  };
  locationStats: LocationStat[];     // 지역별 거래 현황
  categoryStats: CategoryStat[];     // 카테고리별 리뷰 수
  priceDistribution: PriceRangeStat[]; // 가격대별 판매글 분포
  activityTrend: ActivityTrendStat[]; // 최근 30일 활동 추이
  reactionStats: ReactionStat[];     // 리액션 타입별 집계
  popularTags: PopularTagStat[];     // 인기 태그 Top 20
}
```

### 지역별 거래 현황 (`LocationStat`)

| 필드        | 타입     | 설명      |
| :---------- | :------- | :-------- |
| `city`      | `string` | 시/도     |
| `district`  | `string` | 시/군/구  |
| `count`     | `number` | 판매글 수 |
| `latitude`  | `number` | 대표 위도 |
| `longitude` | `number` | 대표 경도 |

### 가격 분포 (`PriceRangeStat`)

가격 구간은 `constants.ts`에 정의된 `PRICE_RANGES`를 기준으로 집계됩니다:

- 0원 ~ 5,000원
- 5,000원 ~ 10,000원
- 10,000원 ~ 20,000원
- 20,000원 ~ 30,000원
- 30,000원 이상

### 활동 추이 (`ActivityTrendStat`)

최근 30일간의 일별 통계를 제공합니다:

- `date`: 날짜 (YYYY-MM-DD)
- `salesCount`: 해당 날짜 판매글 수
- `reviewsCount`: 해당 날짜 리뷰 수

## 4. 쿼리 최적화

인사이트 모듈은 대량의 데이터를 집계하므로 다음과 같은 최적화를 적용했습니다:

- **CASE WHEN 활용**: 가격 분포 집계 시 단일 쿼리로 모든 구간을 계산
- **GROUP BY 최적화**: 지역/카테고리 통계는 GROUP BY로 한 번에 집계
- **LIMIT 적용**: 인기 태그, 지역 통계 등에 TOP N 제한 적용
- **WITHDRAWN 제외**: 판매 취소된 판매글은 통계에서 제외
