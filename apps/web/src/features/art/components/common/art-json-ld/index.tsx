import { GetArtDetailResponse } from "@bookjeok/core";

const getEventType = (genre: string) => {
  if (genre.includes("연극")) return "TheaterEvent";
  if (genre.includes("뮤지컬")) return "TheaterEvent"; // schema.org fallback
  if (
    genre.includes("음악") ||
    genre.includes("클래식") ||
    genre.includes("국악")
  )
    return "MusicEvent";
  if (genre.includes("무용") || genre.includes("발레")) return "DanceEvent";
  return "Event";
};

const formatDate = (dateStr: string) => dateStr.replace(/\./g, "-");

interface ArtJsonLdProps {
  art: GetArtDetailResponse;
  locale: string;
}

export function ArtJsonLd({ art, locale }: ArtJsonLdProps) {
  const eventType = getEventType(art.genrenm);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": eventType,
    name: art.prfnm,
    description: art.sty || `${art.prfnm} 공연 정보`,
    image: art.poster,
    startDate: formatDate(art.prfpdfrom),
    endDate: formatDate(art.prfpdto),
    eventStatus:
      art.prfstate === "공연중" ||
      art.prfstate === "공연예정" ||
      art.prfstate === "공연완료"
        ? "https://schema.org/EventScheduled"
        : "https://schema.org/EventCancelled",
    location: {
      "@type": "Place",
      name: art.fcltynm,
      address: {
        "@type": "PostalAddress",
        addressLocality: art.area,
        addressCountry: "KR",
      },
    },
    url: `https://bookjeok.com/${locale}/art/${art.mt20id}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
