import { describe, expect, it } from "vitest";

import {
  getProfileImageUrl,
  isDefaultProfileImage,
} from "@/shared/utils/profile-image";

describe("isDefaultProfileImage (기본 프로필 식별자 확인)", () => {
  it("기본 프로필 식별자를 올바르게 인식한다", () => {
    expect(isDefaultProfileImage("default_profile1")).toBe(true);
    expect(isDefaultProfileImage("default_profile5")).toBe(true);
    expect(isDefaultProfileImage("default_profile10")).toBe(true);
  });

  it("유효하지 않은 식별자는 false를 반환한다", () => {
    expect(isDefaultProfileImage("default_profile0")).toBe(false);
    expect(isDefaultProfileImage("default_profile11")).toBe(false);
    expect(isDefaultProfileImage("some_random_string")).toBe(false);
  });

  it("null 또는 undefined는 false를 반환한다", () => {
    expect(isDefaultProfileImage(null)).toBe(false);
    expect(isDefaultProfileImage(undefined)).toBe(false);
  });

  it("빈 문자열은 false를 반환한다", () => {
    expect(isDefaultProfileImage("")).toBe(false);
  });
});

describe("getProfileImageUrl (프로필 이미지 URL 변환)", () => {
  it("기본 프로필 식별자를 SVG 경로로 변환한다", () => {
    expect(getProfileImageUrl("default_profile1")).toBe(
      "/images/avatars/default_profile1.svg",
    );
    expect(getProfileImageUrl("default_profile5")).toBe(
      "/images/avatars/default_profile5.svg",
    );
  });

  it("일반 URL은 그대로 반환한다", () => {
    const url = "https://example.com/profile.jpg";
    expect(getProfileImageUrl(url)).toBe(url);
  });

  it("null은 undefined를 반환한다", () => {
    expect(getProfileImageUrl(null)).toBeUndefined();
  });

  it("undefined는 undefined를 반환한다", () => {
    expect(getProfileImageUrl(undefined)).toBeUndefined();
  });
});
