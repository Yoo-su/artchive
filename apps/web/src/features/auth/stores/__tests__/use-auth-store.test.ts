import { User } from "@bookjeok/core";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../use-auth-store";

// 로컬 스토리지 모킹(Mock)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const mockUser = {
  id: 1,
  nickname: "Test User",
  profileImageUrl: "default",
  handle: "testUserHandle",
} as User;

describe("useAuthStore", () => {
  beforeEach(() => {
    // 스토어 상태 초기화 및 로컬스토리지 초기화
    localStorageMock.clear();
    const store = useAuthStore.getState();
    act(() => {
      store.clearAuth();
    });
  });

  it("초기 상태는 인증 정보가 없는 상태(null)여야 한다", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
  });

  it("setUser를 호출하면 user 상태가 업데이트되어야 한다", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("setTokens를 호출하면 토큰 상태가 업데이트되어야 한다", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setTokens({
        accessToken: "access-token-123",
        refreshToken: "refresh-token-123",
      });
    });

    expect(result.current.accessToken).toBe("access-token-123");
    expect(result.current.refreshToken).toBe("refresh-token-123");
  });

  it("setAuth를 호출하면 유저 정보와 토큰 정보가 한 번에 업데이트되어야 한다", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setAuth({
        user: mockUser,
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe("new-access-token");
    expect(result.current.refreshToken).toBe("new-refresh-token");
  });

  it("clearAuth를 호출하면 초기 상태로 되돌아가야 한다", () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setAuth({
        user: mockUser,
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });
    });

    // 상태가 업데이트 되었는지 확인
    expect(result.current.accessToken).not.toBeNull();

    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
  });
});
