import { setRequestLocale } from "next-intl/server";

import { UserProfileView } from "@/views/user-profile-view";

interface UserProfilePageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  return <UserProfileView handle={handle} />;
}
