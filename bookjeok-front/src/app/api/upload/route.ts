import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // 라이브러리 타입 정의에 따라 필수 콜백 함수들을 추가합니다.
      // 토큰 생성 전 실행: 파일 경로명(pathname)을 그대로 사용하도록 설정하고, 허용할 파일 타입도 지정할 수 있습니다.
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // clientPayload에서 토큰 추출
        const { token } = clientPayload ? JSON.parse(clientPayload) : {};

        if (!token) {
          throw new Error("Unauthorized: No token provided");
        }

        // 토큰 유효성 검증 (외부 API 호출)
        try {
          // NEXT_PUBLIC_API_URL을 사용해 사용자 프로필 조회 시도
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
          const response = await fetch(`${apiUrl}/user/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Unauthorized: Invalid token");
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          throw new Error("Unauthorized: Token validation failed");
        }

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
          pathname,
          tokenPayload: JSON.stringify({
            uploadedBy: "user", // 실제 유저 ID를 넣을 수도 있음
          }),
        };
      },
      // 업로드 완료 후 실행: 서버 로그를 남기거나 DB를 업데이트할 수 있습니다.
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("blob upload completed", blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }, // The webhook will retry 5 times waiting for a 200
    );
  }
}
