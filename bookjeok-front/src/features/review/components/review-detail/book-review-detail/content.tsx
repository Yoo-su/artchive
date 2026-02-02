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
      className="prose prose-stone prose-lg md:prose-xl max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-stone-200 prose-blockquote:bg-stone-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
