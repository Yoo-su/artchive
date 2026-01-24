"use client";

import { UserProfile } from "@/features/user/components/profile/user-profile";

interface UserProfileViewProps {
  handle: string;
}

/**
 * 유저 프로필 페이지 View
 */
export const UserProfileView = ({ handle }: UserProfileViewProps) => {
  return <UserProfile handle={handle} />;
};
