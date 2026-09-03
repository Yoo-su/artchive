import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}));

const TOKEN = "test-revalidate-token";

const post = async (
  body: unknown,
  headers: Record<string, string> = { "x-revalidate-token": TOKEN },
) => {
  const { POST } = await import("../route");
  return POST(
    new NextRequest("https://bookjeok.test/api/revalidate", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
};

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.resetModules();
    revalidatePath.mockClear();
    process.env.REVALIDATE_TOKEN = TOKEN;
  });

  afterEach(() => {
    delete process.env.REVALIDATE_TOKEN;
  });

  it("토큰이 설정되지 않으면 503으로 실패한다 (폴백 없음)", async () => {
    delete process.env.REVALIDATE_TOKEN;

    const res = await post({ path: "/ko" });

    expect(res.status).toBe(503);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("토큰이 틀리면 401", async () => {
    const res = await post({ path: "/ko" }, { "x-revalidate-token": "wrong" });

    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("토큰 헤더가 없으면 401", async () => {
    const res = await post({ path: "/ko" }, {});

    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("허용 목록 밖의 경로는 400", async () => {
    for (const path of ["/ko/my-page", "/admin", "../etc", "/fr"]) {
      revalidatePath.mockClear();
      const res = await post({ path });

      expect(res.status).toBe(400);
      expect(revalidatePath).not.toHaveBeenCalled();
    }
  });

  it("ISR 라우트는 재검증한다", async () => {
    for (const path of [
      "/ko",
      "/en/book/market",
      "/ko/book/sales/123",
      "/ko/book/reviews/45",
      "/ko/book/9788934942467/detail",
      "/ko/users/reader42",
      "/en/insights",
    ]) {
      revalidatePath.mockClear();
      const res = await post({ path });

      expect(res.status).toBe(200);
      expect(revalidatePath).toHaveBeenCalledWith(path);
    }
  });

  it("GET 핸들러를 노출하지 않는다 (img 태그 등으로 발동 불가)", async () => {
    const route = await import("../route");

    expect("GET" in route).toBe(false);
  });
});
