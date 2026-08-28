import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { createPageMetadata } from "@/shared/config/metadata";
import { OrderDetailView } from "@/views/order-detail-view";

type Props = {
  params: Promise<{ locale: string; orderId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, orderId } = await params;
  const t = await getTranslations({ locale, namespace: "order.detail" });

  return createPageMetadata({
    title: t("page_title"),
    description: `주문번호 #${orderId} 상세 내역 및 배송 조회`,
    locale,
    path: `/order/${orderId}`,
    noIndex: true,
  });
}

export default async function Page({ params }: Props) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);

  return <OrderDetailView orderId={orderId} />;
}
