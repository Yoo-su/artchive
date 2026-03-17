import { getTranslations } from "next-intl/server";

import { GuestGuard } from "@/features/auth/components/guards/guest-guard";
import { DefaultLayout } from "@/layouts/default-layout";
import { SignupView } from "@/views/signup-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "auth.signup.metadata",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function SignupPage() {
  return (
    <GuestGuard>
      <DefaultLayout>
        <SignupView />
      </DefaultLayout>
    </GuestGuard>
  );
}
