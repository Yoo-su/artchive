import { BookInfo } from "@bookjeok/core";

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
    url: `https://bookjeok.com/${locale}/book/${book.isbn}/detail`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
