import { JsonLd } from "./json-ld";

interface BreadcrumbItem {
  name: string;
  url: string; // e.g. "/ko/book/market"
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

/**
 * 구글 사이트링크 및 검색 최적화를 위한 브레드크롬 구조화 데이터 (JSON-LD) 컴포넌트
 */
export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const baseUrl = "https://bookjeok.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return <JsonLd data={jsonLd} />;
}
