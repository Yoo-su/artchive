import axios from "axios";
import { cache } from "react";

import { GetBookDetailResponseData } from "@/features/book/types";

export const fetchBookDetail = cache(async (isbn: string) => {
  try {
    const response = await axios.get<GetBookDetailResponseData>(
      `https://openapi.naver.com/v1/search/book_adv.json?d_isbn=${isbn}`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("책 상세정보 조회 실패:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "책 목록을 가져오는 데 실패했습니다.",
    );
  }
});
