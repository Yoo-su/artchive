import { AladinSearchResponse, BookInfo, cleanHtmlText, formatAladinCoverImage } from "@bookjeok/core";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { config } from "@/shared/config/env";

export async function GET(request: NextRequest) {
  try {
    // 클라이언트에서 보낸 쿼리 파라미터를 추출합니다.
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const displayNum = Number(searchParams.get("display")) || 10;
    const startNum = Number(searchParams.get("start")) || 1;
    const queryType = (searchParams.get("queryType") as any) || "Keyword";
    const sortParam = searchParams.get("sort") || "sim";

    const pageStart = Math.floor((startNum - 1) / Math.max(displayNum, 1)) + 1;
    const aladinSort = sortParam === "date" ? "PublishTime" : "Accuracy";

    const response = await axios.get<AladinSearchResponse>(
      "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
      {
        params: {
          ttbkey: config.ALADIN_TTB_KEY || process.env.ALADIN_TTB_KEY,
          Query: query,
          QueryType: queryType,
          SearchTarget: "Book",
          MaxResults: displayNum,
          Start: pageStart,
          Sort: aladinSort,
          Output: "js",
          Version: "20131101",
          Cover: "Big",
        },
      },
    );

    const aladinData = response.data;
    const items: BookInfo[] = (aladinData?.item || []).map((item) => ({
      title: cleanHtmlText(item.title),
      author: item.author,
      publisher: cleanHtmlText(item.publisher),
      description: cleanHtmlText(item.description),
      image: formatAladinCoverImage(item.cover),
      isbn: item.isbn13 || item.isbn,
      link: item.link,
      discount: String(item.priceSales || item.priceStandard || ""),
      pubdate: item.pubDate,
    }));

    const data = {
      total: aladinData?.totalResults || 0,
      start: aladinData?.startIndex || startNum,
      display: aladinData?.itemsPerPage || displayNum,
      lastBuildDate: aladinData?.pubDate || new Date().toISOString(),
      items,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("책 목록 조회 실패:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "책 목록을 가져오는 데 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
