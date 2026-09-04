import { TradeCompletionMethod } from "./types";

/**
 * 거래 후기 태그.
 *
 * 후기가 양방향이 되면서 "누구를 평가하는 태그인가"와 "어떤 거래 방식에서
 * 의미가 있는가"가 갈립니다. 배송·포장 태그를 직거래에 노출하면 고를 수 없는
 * 항목이 되고, 판매자를 평가하는 태그를 구매자에게 붙이면 뜻이 통하지 않습니다.
 * 그래서 태그마다 적용 범위를 함께 정의합니다.
 */
export enum TradeReviewTag {
  // 공통 (양방향)
  KIND_MANNER = "KIND_MANNER",
  FAST_RESPONSE = "FAST_RESPONSE",
  ON_TIME = "ON_TIME",
  RUDE_MANNER = "RUDE_MANNER",
  SLOW_RESPONSE = "SLOW_RESPONSE",
  BROKE_PROMISE = "BROKE_PROMISE",

  // 구매자 → 판매자
  GOOD_CONDITION = "GOOD_CONDITION",
  BAD_CONDITION = "BAD_CONDITION",
  FAST_SHIPPING = "FAST_SHIPPING",
  METICULOUS_PACKAGING = "METICULOUS_PACKAGING",
  LATE_SHIPPING = "LATE_SHIPPING",
  POOR_PACKAGING = "POOR_PACKAGING",

  // 판매자 → 구매자
  SMOOTH_TRADE = "SMOOTH_TRADE",
  EXCESSIVE_HAGGLING = "EXCESSIVE_HAGGLING",
  NO_SHOW = "NO_SHOW",
}

/** 후기 대상의 역할 */
export type TradeReviewTargetRole = "SELLER" | "BUYER";

export interface TradeReviewTagSpec {
  sentiment: "POSITIVE" | "NEGATIVE";
  /** 이 태그로 평가할 수 있는 대상. 생략하면 양쪽 모두 */
  targetRole?: TradeReviewTargetRole;
  /** 특정 거래 방식에서만 의미가 있는 태그 */
  method?: TradeCompletionMethod;
}

export const TRADE_REVIEW_TAG_SPECS: Record<
  TradeReviewTag,
  TradeReviewTagSpec
> = {
  // 공통
  [TradeReviewTag.KIND_MANNER]: { sentiment: "POSITIVE" },
  [TradeReviewTag.FAST_RESPONSE]: { sentiment: "POSITIVE" },
  [TradeReviewTag.ON_TIME]: { sentiment: "POSITIVE" },
  [TradeReviewTag.RUDE_MANNER]: { sentiment: "NEGATIVE" },
  [TradeReviewTag.SLOW_RESPONSE]: { sentiment: "NEGATIVE" },
  [TradeReviewTag.BROKE_PROMISE]: { sentiment: "NEGATIVE" },

  // 구매자 → 판매자
  [TradeReviewTag.GOOD_CONDITION]: {
    sentiment: "POSITIVE",
    targetRole: "SELLER",
  },
  [TradeReviewTag.BAD_CONDITION]: {
    sentiment: "NEGATIVE",
    targetRole: "SELLER",
  },
  [TradeReviewTag.FAST_SHIPPING]: {
    sentiment: "POSITIVE",
    targetRole: "SELLER",
    method: TradeCompletionMethod.DELIVERY,
  },
  [TradeReviewTag.METICULOUS_PACKAGING]: {
    sentiment: "POSITIVE",
    targetRole: "SELLER",
    method: TradeCompletionMethod.DELIVERY,
  },
  [TradeReviewTag.LATE_SHIPPING]: {
    sentiment: "NEGATIVE",
    targetRole: "SELLER",
    method: TradeCompletionMethod.DELIVERY,
  },
  [TradeReviewTag.POOR_PACKAGING]: {
    sentiment: "NEGATIVE",
    targetRole: "SELLER",
    method: TradeCompletionMethod.DELIVERY,
  },

  // 판매자 → 구매자
  [TradeReviewTag.SMOOTH_TRADE]: {
    sentiment: "POSITIVE",
    targetRole: "BUYER",
  },
  [TradeReviewTag.EXCESSIVE_HAGGLING]: {
    sentiment: "NEGATIVE",
    targetRole: "BUYER",
  },
  [TradeReviewTag.NO_SHOW]: { sentiment: "NEGATIVE", targetRole: "BUYER" },
};

export const ALL_TRADE_REVIEW_TAGS = Object.keys(
  TRADE_REVIEW_TAG_SPECS,
) as TradeReviewTag[];

export const POSITIVE_TRADE_REVIEW_TAGS = ALL_TRADE_REVIEW_TAGS.filter(
  (tag) => TRADE_REVIEW_TAG_SPECS[tag].sentiment === "POSITIVE",
);

export const NEGATIVE_TRADE_REVIEW_TAGS = ALL_TRADE_REVIEW_TAGS.filter(
  (tag) => TRADE_REVIEW_TAG_SPECS[tag].sentiment === "NEGATIVE",
);

/**
 * 이 거래에서 고를 수 있는 태그 목록.
 *
 * 서버 검증과 클라이언트 렌더링이 같은 규칙을 쓰도록 여기서만 계산합니다.
 */
export const getAvailableTradeReviewTags = (
  targetRole: TradeReviewTargetRole,
  method: TradeCompletionMethod,
): TradeReviewTag[] =>
  ALL_TRADE_REVIEW_TAGS.filter((tag) => {
    const spec = TRADE_REVIEW_TAG_SPECS[tag];
    if (spec.targetRole && spec.targetRole !== targetRole) return false;
    if (spec.method && spec.method !== method) return false;
    return true;
  });

/** 태그가 이 거래·대상에 쓸 수 있는 것인지 */
export const isTradeReviewTagAllowed = (
  tag: string,
  targetRole: TradeReviewTargetRole,
  method: TradeCompletionMethod,
): tag is TradeReviewTag =>
  (getAvailableTradeReviewTags(targetRole, method) as string[]).includes(tag);
