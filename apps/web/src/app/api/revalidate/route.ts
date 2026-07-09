import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function handleRevalidate(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const path = searchParams.get("path");

    // Vercel 환경변수에 등록된 비밀키와 일치하는지 검증 (기본값 설정)
    const token = process.env.REVALIDATE_TOKEN || "yoosurevalidatetoken";
    if (secret !== token) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (!path) {
      return NextResponse.json({ message: "Path is required" }, { status: 400 });
    }

    // Next.js ISR 캐시 파괴 및 즉시 재생성 트리거
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path, now: Date.now() });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Revalidation failed", error: err.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return handleRevalidate(request);
}

export async function POST(request: NextRequest) {
  return handleRevalidate(request);
}
