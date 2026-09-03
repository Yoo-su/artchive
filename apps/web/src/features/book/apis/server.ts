import {
  AladinSearchResponse,
  BookInfo,
  cleanHtmlText,
  DEFAULT_DISPLAY,
  DEFAULT_SORT,
  DEFAULT_START,
  extractAladinDetailedDescription,
  formatAladinCoverImage,
  GetBookDetailResponseData,
  GetBookListParams,
  GetBookListSuccessResponse,
} from "@bookjeok/core";
import axios from "axios";
import { cache } from "react";

// 서버 인메모리 캐시 (10분 유효)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const CACHE_TTL_MS = 10 * 60 * 1000;
const bookDetailCache = new Map<string, CacheEntry<GetBookDetailResponseData>>();
const bookListCache = new Map<string, CacheEntry<GetBookListSuccessResponse>>();

/**
 * 서버 컴포넌트 전용: 알라딘 책 검색 API(ItemSearch.aspx)를 직접 호출합니다.
 * 서버에서는 CORS가 적용되지 않으므로 직접 호출이 가능합니다.
 * @param params 검색 파라미터
 * @returns 책 목록 또는 에러 응답
 */
export const getBookListServer = async (
  params: GetBookListParams,
): Promise<GetBookListSuccessResponse> => {
  const displayNum = params.display ?? DEFAULT_DISPLAY;
  const startNum = params.start ?? DEFAULT_START;
  const sortParam = params.sort ?? DEFAULT_SORT;
  const queryType = params.queryType ?? "Keyword";
  const pageStart = Math.floor((startNum - 1) / Math.max(displayNum, 1)) + 1;
  const aladinSort = sortParam === "date" ? "PublishTime" : "Accuracy";
  const cleanQuery = params.query;

  const cacheKey = `${cleanQuery}:${displayNum}:${startNum}:${sortParam}:${queryType}`;

  const cached = bookListCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await axios.get<AladinSearchResponse>(
      "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
      {
        params: {
          ttbkey: process.env.ALADIN_TTB_KEY,
          Query: cleanQuery,
          QueryType: queryType,
          SearchTarget: "Book",
          MaxResults: displayNum,
          Start: pageStart,
          Sort: aladinSort,
          Output: "js",
          Version: "20131101",
          Cover: "Big",
          OptResult: "fulldescription",
        },
      },
    );

    const aladinData = response.data;
    const items: BookInfo[] = (aladinData.item || []).map((item) => ({
      title: cleanHtmlText(item.title),
      author: cleanHtmlText(item.author),
      publisher: cleanHtmlText(item.publisher),
      description: extractAladinDetailedDescription(item),
      image: formatAladinCoverImage(item.cover),
      isbn: item.isbn13 || item.isbn,
      link: item.link,
      discount: String(item.priceSales || item.priceStandard || ""),
      pubdate: item.pubDate,
    }));

    const data: GetBookListSuccessResponse = {
      total: aladinData.totalResults || 0,
      start: aladinData.startIndex || startNum,
      display: aladinData.itemsPerPage || displayNum,
      lastBuildDate: aladinData.pubDate || new Date().toISOString(),
      items,
    };

    bookListCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("서버에서 책 목록 조회 실패:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "책 목록을 가져오는 데 실패했습니다.",
    );
  }
};

/**
 * 서버 전용: 출판사별 책 목록을 가져와 BookInfo[] 형태로 반환합니다.
 * prefetch queryFn에서 사용하기 위한 헬퍼 함수입니다.
 */
export const getPublisherBooksServer = async (
  publisher: string,
  display: number = 10,
): Promise<BookInfo[]> => {
  const result = await getBookListServer({ query: publisher, display });
  return result.items || [];
};

/**
 * 서버 전용: 알라딘 도서 상세정보(ItemLookUp.aspx)를 조회합니다.
 * React Cache 및 인메모리 캐시를 사용하여 중복 요청을 방지합니다.
 */
export const fetchBookDetail = cache(async (isbn: string) => {
  const cached = bookDetailCache.get(isbn);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const itemIdType = isbn.length === 13 ? "ISBN13" : "ISBN";

    const response = await axios.get<AladinSearchResponse>(
      "https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx",
      {
        params: {
          ttbkey: process.env.ALADIN_TTB_KEY,
          ItemId: isbn,
          ItemIdType: itemIdType,
          Output: "js",
          Version: "20131101",
          Cover: "Big",
          OptResult: "fulldescription",
        },
      },
    );

    const aladinData = response.data;

    // 알라딘은 TTB 키 오류·쿼터 초과도 HTTP 200 + { errorCode, errorMessage }로 응답
    // - item 배열 부재는 "책 없음"이 아닌 API 장애이므로 빈 결과로 흘리지 않음
    // - 호출부가 notFound()로 처리하면 그 404가 ISR 캐시에 24시간 고착
    if (!Array.isArray(aladinData.item)) {
      throw new Error(
        `알라딘 응답에 item이 없습니다: ${JSON.stringify(aladinData).slice(0, 200)}`,
      );
    }

    const items: BookInfo[] = aladinData.item.map((item) => ({
      title: cleanHtmlText(item.title),
      author: cleanHtmlText(item.author),
      publisher: cleanHtmlText(item.publisher),
      description: extractAladinDetailedDescription(item),
      image: formatAladinCoverImage(item.cover),
      isbn: item.isbn13 || item.isbn,
      link: item.link,
      discount: String(item.priceSales || item.priceStandard || ""),
      pubdate: item.pubDate,
    }));

    const data: GetBookDetailResponseData = {
      total: aladinData.totalResults || items.length,
      start: aladinData.startIndex || 1,
      display: aladinData.itemsPerPage || 10,
      lastBuildDate: aladinData.pubDate || new Date().toISOString(),
      items,
    };

    bookDetailCache.set(isbn, { data, timestamp: Date.now() });

    return data;
  } catch (error) {
    console.error("책 상세정보 조회 실패:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "책 상세정보를 가져오는 데 실패했습니다.",
    );
  }
});
