import { getTranslations } from "next-intl/server";

import { GuestGuard } from "@/features/auth/components/guards/guest-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { createPageMetadata } from "@/shared/config/metadata";
import { LoginView } from "@/views/login-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth.login.metadata" });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    noIndex: true,
  });
}

export default function Page() {
  return (
    <GuestGuard>
      <DefaultLayout>
        <LoginView />
      </DefaultLayout>
    </GuestGuard>
  );
}
