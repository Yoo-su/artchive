import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { UserProfileView } from "@/views/user-profile-view";

interface UserProfilePageProps {
  params: Promise<{ locale: string; handle: string }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "user_profile.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
  });
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  return <UserProfileView handle={handle} />;
}
