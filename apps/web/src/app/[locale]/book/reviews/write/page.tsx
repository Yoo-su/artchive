import { getTranslations } from "next-intl/server";

import { AuthGuard } from "@/features/auth/components/guards/auth-guard";
import { createPageMetadata } from "@/shared/config/metadata";
import { ReviewWriteView } from "@/views/review-write-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "review.write.metadata",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale,
    path: "/book/reviews/write",
    noIndex: true,
  });
}

export default function Page() {
  return (
    <AuthGuard>
      <ReviewWriteView />
    </AuthGuard>
  );
}
