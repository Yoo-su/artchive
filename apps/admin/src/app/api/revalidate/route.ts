import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 웹 서비스 재검증 웹훅의 서버 경유지
 *
 * 브라우저에서 직접 호출하면 시크릿이 NEXT_PUBLIC_으로 번들에 실려 공개된다.
 * 어드민 서버가 대신 호출해 시크릿이 클라이언트로 나가지 않게 한다.
 *
 * ⚠️ 호출자 검증은 "로그인된 세션인지"까지만 한다. 역할(ADMIN) 검사는
 * 서버의 AdminGuard가 실제 라우트에 적용된 뒤 그쪽으로 옮겨야 한다.
 */
export async function POST(request: NextRequest) {
  const token = process.env.REVALIDATE_TOKEN;
  const webUrl = process.env.USER_WEB_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!token || !webUrl || !apiUrl) {
    return NextResponse.json(
      { message: "Revalidation proxy is not configured" },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const me = await fetch(`${apiUrl}/user/profile`, {
    headers: { authorization },
    cache: "no-store",
  }).catch(() => null);

  if (!me?.ok) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const path = body?.path;

  if (typeof path !== "string" || !path) {
    return NextResponse.json({ message: "Path is required" }, { status: 400 });
  }

  const response = await fetch(`${webUrl}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-token": token,
    },
    body: JSON.stringify({ path }),
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return NextResponse.json(
      { message: "Revalidation request failed" },
      { status: 502 },
    );
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
