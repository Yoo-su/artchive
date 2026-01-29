import { redirect } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: PATHS.HOME, locale });
}
