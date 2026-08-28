import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { OrderPaymentFailView } from "@/views/order-payment-fail-view";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order.payment.fail" });

  return createPageMetadata({
    title: t("title"),
    description: t("subtitle"),
    locale,
    path: "/order/payment/fail",
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED !== "true") {
    redirect("/");
  }

  const { locale } = await params;
  setRequestLocale(locale);

  return <OrderPaymentFailView />;
}
