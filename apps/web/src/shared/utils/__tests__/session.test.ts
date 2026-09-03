import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  consumeSessionToast,
  hardRedirect,
  markSessionToast,
  redirectToLogin,
} from "@/shared/utils/session";

const originalLocation = window.location;

/** window.location을 읽고 쓸 수 있는 더미로 교체 (jsdom은 실제 이동을 지원하지 않음) */
const stubLocation = (pathname: string) => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, href: `https://bookjeok.com${pathname}` },
  });
};

describe("세션 종료 유틸", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  describe("hardRedirect", () => {
    it("현재 로케일을 유지한 채 이동한다", () => {
      stubLocation("/en/my-page");
      hardRedirect("/login");
      expect(window.location.href).toBe("/en/login");
    });

    it("로케일을 알 수 없으면 기본 로케일(ko)로 이동한다", () => {
      stubLocation("/my-page");
      hardRedirect("/login");
      expect(window.location.href).toBe("/ko/login");
    });

    it("홈(/)은 로케일 경로만 남긴다 — 중복 슬래시로 리다이렉트가 한 번 더 돌지 않도록", () => {
      stubLocation("/ko/book/market");
      hardRedirect("/");
      expect(window.location.href).toBe("/ko");
    });
  });

  it("redirectToLogin은 로케일별 로그인 경로로 보낸다", () => {
    stubLocation("/en/book/market");
    redirectToLogin();
    expect(window.location.href).toBe("/en/login");
  });

  describe("세션 토스트 인계", () => {
    it("예약한 메시지를 한 번만 꺼낸다", () => {
      markSessionToast("로그아웃되었습니다");

      expect(consumeSessionToast()).toBe("로그아웃되었습니다");
      expect(consumeSessionToast()).toBeNull();
    });

    it("예약된 메시지가 없으면 null을 돌려준다", () => {
      expect(consumeSessionToast()).toBeNull();
    });
  });
});
