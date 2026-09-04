import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { UserAvatarMenu } from "../user-avatar-menu";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => `common.${key}`,
}));

vi.mock("@/shared/config/i18n/routing", () => ({
  Link: ({ children, href, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
}));

describe("UserAvatarMenu 컴포넌트", () => {
  const mockUser = {
    id: 1,
    handle: "user_handle",
    nickname: "작은콩",
    profileImageUrl: null,
  };

  it("핸들이 있는 경우 프로필 링크(a 태그)로 렌더링되고 아바타를 포함한다", () => {
    render(<UserAvatarMenu user={mockUser} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/users/user_handle");
    expect(screen.getByText("작은")).toBeInTheDocument(); // Avatar fallback
  });

  it("showNickname이 true이면 닉네임과 라벨을 렌더링한다", () => {
    render(<UserAvatarMenu user={mockUser} showNickname label="판매자" />);

    expect(screen.getByText("작은콩")).toBeInTheDocument();
    expect(screen.getByText("판매자")).toBeInTheDocument();
  });

  it("핸들이 없으면 링크 없이 아바타만 렌더링한다", () => {
    render(<UserAvatarMenu user={{ ...mockUser, handle: null }} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("작은")).toBeInTheDocument();
  });
});
