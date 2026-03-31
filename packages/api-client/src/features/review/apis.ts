import { API_PATHS, GetReviewsParams, GetReviewsResponse, Review, ReviewFeed, ReviewFormValues, ReviewReactionType } from "@bookjeok/core";
import { AxiosInstance } from "axios";

/**
 * 리뷰를 생성합니다.
 */
export const createReview = async (
  client: AxiosInstance,
  formValues: ReviewFormValues,
) => {
  const { data } = await client.post<Review>(API_PATHS.review.base, formValues);
  return data;
};

/**
 * 리뷰를 수정합니다.
 */
export const updateReview = async (
  client: AxiosInstance,
  id: number,
  formValues: ReviewFormValues,
) => {
  const { data } = await client.patch<Review>(
    API_PATHS.review.detail(id),
    formValues,
  );
  return data;
};

/**
 * 리뷰를 삭제합니다.
 */
export const deleteReview = async (client: AxiosInstance, id: number) => {
  const { data } = await client.delete<Review>(API_PATHS.review.detail(id));
  return data;
};

/**
 * 리뷰 목록을 조회합니다.
 */
export const getReviews = async (
  client: AxiosInstance,
  {
    page = 1,
    limit = 10,
    isbn,
    tag,
    search,
    category,
    userId,
    excludeId,
    cursorId,
  }: GetReviewsParams,
) => {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (isbn) params.append("isbn", isbn);
  if (tag) params.append("tag", tag);
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (userId) params.append("userId", userId.toString());
  if (excludeId) params.append("excludeId", excludeId.toString());
  if (cursorId) params.append("cursorId", cursorId.toString());

  const { data } = await client.get<GetReviewsResponse>(
    `${API_PATHS.review.base}?${params.toString()}`,
  );
  return data;
};

/**
 * 리뷰 피드(카테고리별 최신 리뷰)를 조회합니다.
 */
export const getReviewFeeds = async (client: AxiosInstance) => {
  const { data } = await client.get<ReviewFeed[]>(API_PATHS.review.feeds);
  return data;
};

/**
 * 인기 리뷰를 조회합니다.
 */
export const getPopularReviews = async (client: AxiosInstance) => {
  const { data } = await client.get<Review[]>(API_PATHS.review.popular);
  return data;
};

/**
 * 리뷰 상세 정보를 조회합니다.
 */
export const getReview = async (client: AxiosInstance, id: number) => {
  const { data } = await client.get<Review>(API_PATHS.review.detail(id));
  return data;
};

/**
 * 수정을 위한 리뷰 조회 (본인 리뷰만 조회 가능)
 */
export const getReviewForEdit = async (client: AxiosInstance, id: number) => {
  const { data } = await client.get<Review>(API_PATHS.review.edit(id));
  return data;
};

/**
 * 추천 리뷰(복합 로직)를 조회합니다.
 */
export const getRecommendedReviews = async (
  client: AxiosInstance,
  id: number,
) => {
  const { data } = await client.get<Review[]>(API_PATHS.review.recommend(id));
  return data;
};

/**
 * 나의 리액션 정보를 조회합니다.
 */
export const getMyReviewReaction = async (client: AxiosInstance, id: number) => {
  const { data } = await client.get<ReviewReactionType | null>(
    API_PATHS.review.myReaction(id),
  );
  return data;
};

/**
 * 리뷰 리액션을 토글합니다.
 */
export const toggleReviewReaction = async (
  client: AxiosInstance,
  id: number,
  type: ReviewReactionType,
) => {
  const { data } = await client.post<Review>(
    API_PATHS.review.toggleReaction(id),
    { type },
  );
  return data;
};
