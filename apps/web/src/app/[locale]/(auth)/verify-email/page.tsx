import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { DefaultLayout } from "@/layouts/default-layout";
import { createPageMetadata } from "@/shared/config/metadata";
import { VerifyEmailView } from "@/views/verify-email-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.verification",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("title"),
    locale,
    path: "/verify-email",
    noIndex: true,
  });
}

export default function VerifyEmailPage() {
  return (
    <DefaultLayout>
      <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center" />}>
        <VerifyEmailView />
      </Suspense>
    </DefaultLayout>
  );
}
