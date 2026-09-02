import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * 업로드를 허용할 카테고리 목록.
 * 경로는 항상 `{provider}-{userId}/{카테고리}/{파일명}` 형태여야 합니다.
 */
const ALLOWED_CATEGORIES = [
  "profile",
  "sales-images",
  "review-images",
  "chat-images",
] as const;

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

interface AuthenticatedUser {
  id: number;
  provider: string;
}

/** 액세스 토큰으로 사용자를 식별합니다. 토큰이 유효하지 않으면 예외를 던집니다. */
async function resolveUser(token: string): Promise<AuthenticatedUser> {
  // 서버 통신용 API_URL을 우선 적용하고, 없을 경우 NEXT_PUBLIC_API_URL로 폴백
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  const response = await fetch(`${apiUrl}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Unauthorized: Invalid token");
  }

  const body = await response.json();
  const user = body?.data;

  if (!user || typeof user.id !== "number" || !user.provider) {
    throw new Error("Unauthorized: Malformed profile response");
  }

  return { id: user.id, provider: user.provider };
}

/**
 * 업로드 경로가 요청자 본인의 소유인지 검증합니다.
 * 클라이언트가 보낸 경로를 신뢰하면 타 사용자 디렉터리에 업로드할 수 있으므로
 * 접두사와 카테고리를 서버에서 강제합니다.
 */
function assertOwnedPathname(pathname: string, user: AuthenticatedUser): void {
  // 상위 경로 탈출 및 절대 경로 차단
  if (pathname.includes("..") || pathname.startsWith("/")) {
    throw new Error("Forbidden: Invalid pathname");
  }

  const segments = pathname.split("/");
  if (segments.length < 3) {
    throw new Error("Forbidden: Invalid pathname structure");
  }

  const [prefix, category, ...rest] = segments;

  if (prefix !== `${user.provider}-${user.id}`) {
    throw new Error("Forbidden: Pathname does not belong to the current user");
  }

  if (!ALLOWED_CATEGORIES.includes(category as (typeof ALLOWED_CATEGORIES)[number])) {
    throw new Error("Forbidden: Disallowed upload category");
  }

  if (rest.some((segment) => segment.length === 0)) {
    throw new Error("Forbidden: Invalid pathname structure");
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      // 토큰 생성 전 실행: 요청자 식별 및 업로드 경로 소유권 검증
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const { token } = clientPayload ? JSON.parse(clientPayload) : {};

        if (!token) {
          throw new Error("Unauthorized: No token provided");
        }

        const user = await resolveUser(token);
        assertOwnedPathname(pathname, user);

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          pathname,
          tokenPayload: JSON.stringify({
            uploadedBy: user.id,
            provider: user.provider,
          }),
        };
      },
      // 업로드 완료 후 실행: 서버 로그 기록 또는 DB 갱신 지점
      onUploadCompleted: async () => {
        // console.log("blob upload completed", blob, tokenPayload);
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
