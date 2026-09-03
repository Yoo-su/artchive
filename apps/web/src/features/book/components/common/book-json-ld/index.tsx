import { BookInfo } from "@bookjeok/core";

import { JsonLd } from "@/shared/components/json-ld";

interface BookJsonLdProps {
  book: BookInfo;
  locale: string;
}

export function BookJsonLd({ book, locale }: BookJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: {
      "@type": "Person",
      name: book.author,
    },
    isbn: book.isbn,
    image: book.image,
    publisher: {
      "@type": "Organization",
      name: book.publisher,
    },
    datePublished: book.pubdate,
    description: book.description,
    inLanguage: locale === "en" ? "en" : "ko",
    url: `https://bookjeok.com/${locale}/book/${book.isbn}/detail`,
  };

  return <JsonLd data={jsonLd} />;
}
