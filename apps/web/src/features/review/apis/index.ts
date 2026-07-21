import {
  createReview as sharedCreateReview,
  deleteReview as sharedDeleteReview,
  getMyReviewReaction as sharedGetMyReviewReaction,
  getPopularReviews as sharedGetPopularReviews,
  getRecommendedReviews as sharedGetRecommendedReviews,
  getReview as sharedGetReview,
  getReviewFeeds as sharedGetReviewFeeds,
  getReviewForEdit as sharedGetReviewForEdit,
  getReviews as sharedGetReviews,
  recordReviewView as sharedRecordReviewView,
  toggleReviewReaction as sharedToggleReviewReaction,
  updateReview as sharedUpdateReview,
} from "@bookjeok/api-client";
import {
  GetReviewsParams,
  GetReviewsResponse,
  Review,
  ReviewFeed,
  ReviewFormValues,
  ReviewReactionType,
} from "@bookjeok/core";

/**
 * 리뷰를 생성합니다.
 * @param data 리뷰 생성 데이터
 * @returns 생성된 리뷰 정보
 */
export const createReview = async (formValues: ReviewFormValues) => {
  return sharedCreateReview(formValues);
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
  return sharedUpdateReview(id, formValues);
};

/**
 * 리뷰를 삭제합니다.
 * @param id 삭제할 리뷰 ID
 * @returns 삭제된 리뷰 정보
 */
export const deleteReview = async (id: number) => {
  return sharedDeleteReview(id);
};

/**
 * 리뷰 목록을 조회합니다.
 * @param params 조회 파라미터 (페이지, 검색어, 카테고리 등)
 * @returns 리뷰 목록
 */
export const getReviews = async (params: GetReviewsParams) => {
  return sharedGetReviews(params);
};

/**
 * 리뷰 피드(카테고리별 최신 리뷰)를 조회합니다.
 * @returns 리뷰 피드 목록
 */
export const getReviewFeeds = async () => {
  return sharedGetReviewFeeds();
};

/**
 * 인기 리뷰를 조회합니다.
 * @returns 인기 리뷰 목록
 */
export const getPopularReviews = async () => {
  return sharedGetPopularReviews();
};

/**
 * 리뷰 상세 정보를 조회합니다.
 * @param id 리뷰 ID
 * @returns 리뷰 상세 정보
 */
export const getReview = async (id: number) => {
  return sharedGetReview(id);
};

/**
 * 인증된 상태로 리뷰 상세 정보를 조회합니다.
 * 비공개 리뷰의 경우 본인만 조회 가능합니다.
 * @param id 리뷰 ID
 * @returns 리뷰 상세 정보
 */
export const getReviewAuthenticated = async (id: number) => {
  return sharedGetReview(id);
};

/**
 * 수정을 위한 리뷰 조회 (본인 리뷰만 조회 가능)
 * 본인 리뷰가 아닌 경우 403 Forbidden 에러가 발생합니다.
 * @param id 리뷰 ID
 * @returns 리뷰 상세 정보 (본인 리뷰만)
 */
export const getReviewForEdit = async (id: number) => {
  return sharedGetReviewForEdit(id);
};

/**
 * 추천 리뷰(복합 로직)를 조회합니다.
 * @param id 현재 리뷰 ID
 * @returns 추천 리뷰 목록
 */
export const getRecommendedReviews = async (id: number) => {
  return sharedGetRecommendedReviews(id);
};

/**
 * 나의 리액션 정보를 조회합니다.
 * @param id 리뷰 ID
 * @returns 나의 리액션 타입 (없으면 null)
 */
export const getMyReviewReaction = async (id: number) => {
  return sharedGetMyReviewReaction(id);
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
  return sharedToggleReviewReaction(id, type);
};

/**
 * 리뷰 상세페이지 조회수를 기록합니다.
 * @param id 리뷰 ID
 */
export const recordReviewView = async (id: number) => {
  return sharedRecordReviewView(id);
};
