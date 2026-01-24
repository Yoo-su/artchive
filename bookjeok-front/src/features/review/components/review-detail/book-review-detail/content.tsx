"use client";

import DOMPurify from "dompurify";

interface ReviewDetailContentProps {
  content: string;
}

export function ReviewDetailContent({ content }: ReviewDetailContentProps) {
  // XSS 공격 방지를 위해 HTML 콘텐츠를 sanitize 처리
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div
      className="prose prose-stone prose-lg md:prose-xl max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
