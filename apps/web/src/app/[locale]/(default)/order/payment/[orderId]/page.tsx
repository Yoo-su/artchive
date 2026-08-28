import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { OrderPaymentView } from "@/views/order-payment-view";

type Props = {
  params: Promise<{ locale: string; orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, orderId } = await params;
  const t = await getTranslations({ locale, namespace: "order.payment" });

  return createPageMetadata({
    title: t("page_title"),
    description: t("checkout_title"),
    locale,
    path: `/order/payment/${orderId}`,
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  if (process.env.NEXT_PUBLIC_FEATURE_PAYMENT_ENABLED !== "true") {
    redirect("/");
  }

  const { locale, orderId } = await params;
  setRequestLocale(locale);

  return <OrderPaymentView orderId={orderId} />;
}
