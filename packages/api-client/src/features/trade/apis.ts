import {
  API_PATHS,
  CompleteTradeParams,
  CompleteTradeResult,
  CreateTradeReviewParams,
  GetMyCompletionsResponse,
  GetTradeReviewsResponse,
  QueryMyCompletionsParams,
  QueryTradeReviewParams,
  ReserveSaleParams,
  SellerTradeStats,
  TradeCandidate,
  TradeCompletion,
  TradeReview,
  TradeReviewEligibility,
  UpdateTradeReviewParams,
  UsedBookSale,
} from "@bookjeok/core";

import { privateApiClient, publicApiClient } from "../../client";
import {
  IdempotencyOptions,
  withIdempotencyKey,
} from "../../utils/idempotency";

/**
 * 판매자가 구매희망자 한 명을 거래 상대로 지정하고 판매글을 예약중으로 바꿉니다.
 * 결제 없이 진행되는 직거래 흐름입니다.
 */
export const reserveSaleForBuyer = async (
  { saleId, buyerId, chatRoomId }: ReserveSaleParams,
  options?: IdempotencyOptions,
): Promise<UsedBookSale> => {
  const { data } = await privateApiClient.post<UsedBookSale>(
    API_PATHS.trade.reservation(saleId),
    { buyerId, chatRoomId },
    withIdempotencyKey(options),
  );
  return data;
};

/**
 * 거래 상대 지정을 취소하고 판매글을 다시 판매중으로 되돌립니다.
 */
export const cancelSaleReservation = async (
  saleId: number,
  options?: IdempotencyOptions,
): Promise<UsedBookSale> => {
  const { data } = await privateApiClient.delete<UsedBookSale>(
    API_PATHS.trade.reservation(saleId),
    withIdempotencyKey(options),
  );
  return data;
};

/**
 * 직거래를 완료 처리합니다. 거래 상대가 있으면 완료 기록이 남아
 * 양쪽 모두 후기를 쓸 수 있습니다.
 */
export const completeDirectTrade = async (
  { saleId, buyerId, chatRoomId, withoutCounterparty }: CompleteTradeParams,
  options?: IdempotencyOptions,
): Promise<CompleteTradeResult> => {
  const { data } = await privateApiClient.post<CompleteTradeResult>(
    API_PATHS.trade.completion(saleId),
    { buyerId, chatRoomId, withoutCounterparty },
    withIdempotencyKey(options),
  );
  return data;
};

/**
 * 내가 사거나 판 거래의 완료 내역을 조회합니다.
 */
export const getMyTradeCompletions = async (
  params?: QueryMyCompletionsParams,
): Promise<GetMyCompletionsResponse> => {
  const { data } = await privateApiClient.get<GetMyCompletionsResponse>(
    API_PATHS.trade.myCompletions,
    { params },
  );
  return data;
};

/**
 * 채팅방에서 성사된 거래 완료 기록을 조회합니다. 없으면 null입니다.
 */
export const getTradeCompletionByRoom = async (
  roomId: number,
): Promise<TradeCompletion | null> => {
  const { data } = await privateApiClient.get<TradeCompletion | null>(
    API_PATHS.trade.completionByRoom(roomId),
  );
  return data;
};

/**
 * 거래 완료 기록 상세를 조회합니다. 거래 당사자만 조회할 수 있습니다.
 */
export const getTradeCompletion = async (
  completionId: number,
): Promise<TradeCompletion> => {
  const { data } = await privateApiClient.get<TradeCompletion>(
    API_PATHS.trade.completionDetail(completionId),
  );
  return data;
};

/**
 * 판매글로 대화한 구매희망자 목록. 마이페이지에서 거래 상대를 고를 때 씁니다.
 */
export const getTradeCandidates = async (
  saleId: number,
): Promise<TradeCandidate[]> => {
  const { data } = await privateApiClient.get<TradeCandidate[]>(
    API_PATHS.trade.candidates(saleId),
  );
  return data;
};

/**
 * 완료된 거래에 대해 상대방에게 후기를 작성합니다. 양쪽 모두 각 한 건씩 쓸 수 있습니다.
 */
export const createTradeReview = async (
  params: CreateTradeReviewParams,
): Promise<TradeReview> => {
  const { data } = await privateApiClient.post<TradeReview>(
    API_PATHS.tradeReview.base,
    params,
  );
  return data;
};

/**
 * 작성한 거래 후기를 수정합니다.
 */
export const updateTradeReview = async (
  reviewId: number,
  params: UpdateTradeReviewParams,
): Promise<TradeReview> => {
  const { data } = await privateApiClient.patch<TradeReview>(
    API_PATHS.tradeReview.detail(reviewId),
    params,
  );
  return data;
};

/**
 * 특정 사용자가 거래 상대에게 받은 후기 목록을 조회합니다.
 */
export const getUserTradeReviews = async (
  handle: string,
  params?: QueryTradeReviewParams,
): Promise<GetTradeReviewsResponse> => {
  const { data } = await publicApiClient.get<GetTradeReviewsResponse>(
    API_PATHS.tradeReview.userReviews(handle),
    { params },
  );
  return data;
};

/**
 * 거래 통계와 신뢰 지표를 조회합니다. 직거래/택배 건수가 나뉘어 옵니다.
 */
export const getSellerStats = async (
  handle: string,
): Promise<SellerTradeStats> => {
  const { data } = await publicApiClient.get<SellerTradeStats>(
    API_PATHS.tradeReview.sellerStats(handle),
  );
  return data;
};

/**
 * 이 거래에 대해 내가 후기를 쓸 수 있는지 조회합니다.
 */
export const getMyTradeReviewEligibility = async (
  completionId: number,
): Promise<TradeReviewEligibility> => {
  const { data } = await privateApiClient.get<TradeReviewEligibility>(
    API_PATHS.tradeReview.eligibility(completionId),
  );
  return data;
};
