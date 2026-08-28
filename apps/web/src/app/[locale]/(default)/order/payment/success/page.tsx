import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { OrderPaymentSuccessView } from "@/views/order-payment-success-view";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "order.payment.success" });

  return createPageMetadata({
    title: t("title"),
    description: t("subtitle"),
    locale,
    path: "/order/payment/success",
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <OrderPaymentSuccessView />;
}
