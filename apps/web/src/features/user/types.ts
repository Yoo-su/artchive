import { BookInfo } from "../book/types";
import { UsedBookSale } from "../book-sale/types";
import { ReadingLog } from "../reading-log/types";

// ...

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
