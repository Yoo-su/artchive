import { BookInfo } from "../book/types";
import { UsedBookSale } from "../book-sale/types";
import { ReadingLog } from "../reading-log/types";

export interface WishlistItem {
  id: number;
  book: BookInfo | null;
  usedBookSale: UsedBookSale | null;
  createdAt: string;
}

export interface PublicUserProfile {
  id: number;
  handle: string;
  nickname: string;
  profileImageUrl: string | null;
  createdAt: string;
  /** 이메일 인증 여부. 거래 상대 신뢰도 판단용으로 인증 여부만 공개하며 이메일 주소 자체는 공개하지 않는다. */
  isEmailVerified: boolean;
  /** 마지막 접속 시각(ISO 8601). 한 번도 기록되지 않았으면 null. */
  lastActiveAt: string | null;
  stats: {
    salesCount: number;
    reviewsCount: number;
  };
  recentReviews: {
    id: number;
    title: string;
    bookTitle: string;
    bookImage: string | null;
    createdAt: string;
  }[];
  recentSales: {
    id: number;
    bookTitle: string;
    bookImage: string | null;
    price: number;
    status: string;
    createdAt: string;
  }[];
  readingLogs?: ReadingLog[];
}

export interface RecentReview {
  id: number;
  title: string;
  bookTitle: string;
  bookImage: string | null;
  createdAt: string;
}

export interface RecentSale {
  id: number;
  bookTitle: string;
  bookImage: string | null;
  price: number;
  status: string;
  createdAt: string;
}

export interface UserStats {
  salesCount: number;
  salesStatusCounts: {
    FOR_SALE?: number;
    RESERVED?: number;
    SOLD?: number;
    WITHDRAWN?: number;
  };
  chatRoomCount: number;
  reviewsCount: number;
}

export interface UpdateUserProfileParams {
  nickname?: string;
  profileImageUrl?: string;
  name?: string | null;
  gender?: string | null;
  ageRange?: string | null;
  email?: string;
}
