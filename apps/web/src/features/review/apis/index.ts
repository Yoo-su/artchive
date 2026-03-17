import {
  GetReviewsParams,
  GetReviewsResponse,
  Review,
  ReviewFeed,
  ReviewFormValues,
  ReviewReactionType,
} from "@/features/review/types";
import { API_PATHS } from "@/shared/constants/apis";
import { privateAxios, publicAxios } from "@/shared/libs/axios";

/**
 * 리뷰를 생성합니다.
 * @param data 리뷰 생성 데이터
 * @returns 생성된 리뷰 정보
 */
export const createReview = async (formValues: ReviewFormValues) => {
  const { data } = await privateAxios.post<Review>(
    API_PATHS.review.base,
    formValues,
  );
  return data;
};

/**
 * 리뷰를 수정합니다.
 * @param id 리뷰 ID
 * @param data 수정할 데이터
 * @returns 수정된 리뷰 정보
 */
export const updateReview = async (
  id: number,
  formValues: ReviewFormValues,
) => {
  const { data } = await privateAxios.patch<Review>(
    API_PATHS.review.detail(id),
    formValues,
  );
  return data;
};

/**
 * 리뷰를 삭제합니다.
 * @param id 삭제할 리뷰 ID
 * @returns 삭제된 리뷰 정보
 */
export const deleteReview = async (id: number) => {
  const { data } = await privateAxios.delete<Review>(
    API_PATHS.review.detail(id),
  );
  return data;
};

/**
 * 리뷰 목록을 조회합니다.
 * @param params 조회 파라미터 (페이지, 검색어, 카테고리 등)
 * @returns 리뷰 목록
 */
export const getReviews = async ({
  page = 1,
  limit = 10,
  bookIsbn,
  tag,
  search,
  category,
  userId,
  excludeId,
  cursorId,
}: GetReviewsParams) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (bookIsbn) params.append("bookIsbn", bookIsbn);
  if (tag) params.append("tag", tag);
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (userId) params.append("userId", userId.toString());
  if (excludeId) params.append("excludeId", excludeId.toString());
  if (cursorId) params.append("cursorId", cursorId.toString());

  const { data } = await publicAxios.get<GetReviewsResponse>(
    `${API_PATHS.review.base}?${params.toString()}`,
  );
  return data;
};

/**
 * 리뷰 피드(카테고리별 최신 리뷰)를 조회합니다.
 * @returns 리뷰 피드 목록
 */
export const getReviewFeeds = async () => {
  const { data } = await publicAxios.get<ReviewFeed[]>(API_PATHS.review.feeds);
  return data;
};

/**
 * 인기 리뷰를 조회합니다.
 * @returns 인기 리뷰 목록
 */
export const getPopularReviews = async () => {
  const { data } = await publicAxios.get<Review[]>(API_PATHS.review.popular);
  return data;
};

/**
 * 리뷰 상세 정보를 조회합니다.
 * @param id 리뷰 ID
 * @returns 리뷰 상세 정보
 */
export const getReview = async (id: number) => {
  const { data } = await publicAxios.get<Review>(API_PATHS.review.detail(id));
  return data;
};

/**
 * 인증된 상태로 리뷰 상세 정보를 조회합니다.
 * 비공개 리뷰의 경우 본인만 조회 가능합니다.
 * @param id 리뷰 ID
 * @returns 리뷰 상세 정보
 */
export const getReviewAuthenticated = async (id: number) => {
  const { data } = await privateAxios.get<Review>(API_PATHS.review.detail(id));
  return data;
};

/**
 * 수정을 위한 리뷰 조회 (본인 리뷰만 조회 가능)
 * 본인 리뷰가 아닌 경우 403 Forbidden 에러가 발생합니다.
 * @param id 리뷰 ID
 * @returns 리뷰 상세 정보 (본인 리뷰만)
 */
export const getReviewForEdit = async (id: number) => {
  const { data } = await privateAxios.get<Review>(API_PATHS.review.edit(id));
  return data;
};

/**
 * 추천 리뷰(복합 로직)를 조회합니다.
 * @param id 현재 리뷰 ID
 * @returns 추천 리뷰 목록
 */
export const getRecommendedReviews = async (id: number) => {
  const { data } = await publicAxios.get<Review[]>(
    API_PATHS.review.recommend(id),
  );
  return data;
};

/**
 * 나의 리액션 정보를 조회합니다.
 * @param id 리뷰 ID
 * @returns 나의 리액션 타입 (없으면 null)
 */
export const getMyReviewReaction = async (id: number) => {
  const { data } = await privateAxios.get<ReviewReactionType | null>(
    API_PATHS.review.myReaction(id),
  );
  return data;
};

/**
 * 리뷰 리액션을 토글합니다.
 * @param id 리뷰 ID
 * @param type 리액션 타입
 * @returns 업데이트된 리뷰 정보 (리액션 카운트 포함)
 */
export const toggleReviewReaction = async (
  id: number,
  type: ReviewReactionType,
) => {
  const { data } = await privateAxios.post<Review>(
    API_PATHS.review.toggleReaction(id),
    { type },
  );
  return data;
};
