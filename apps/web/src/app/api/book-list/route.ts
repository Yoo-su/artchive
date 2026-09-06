import { API_PATHS } from "@bookjeok/core";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { config } from "@/shared/config/env";

/**
 * 도서 목록 조회 프록시.
 *
 * 외부 공급처 호출은 백엔드가 전담하므로 여기서는 백엔드로 넘기기만 합니다.
 * 앱 내부에서 호출하는 곳은 없고 외부 클라이언트 호환을 위해 남겨둔 경로라,
 * 사용처가 없음이 확인되면 삭제 대상입니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiBaseUrl =
      process.env.API_URL ||
      config.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";

    const response = await axios.get(`${apiBaseUrl}${API_PATHS.book.list}`, {
      params: {
        query: searchParams.get("query") || "",
        display: searchParams.get("display") || undefined,
        start: searchParams.get("start") || undefined,
        sort: searchParams.get("sort") || undefined,
        queryType: searchParams.get("queryType") || undefined,
      },
    });

    // 백엔드가 이미 `{ success, data }`로 감싸 보내므로 그대로 전달한다.
    return NextResponse.json(response.data);
  } catch (error) {
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
