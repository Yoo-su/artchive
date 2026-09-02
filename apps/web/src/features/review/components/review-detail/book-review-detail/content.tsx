"use client";

import { sanitizeReviewContent } from "@/shared/utils/sanitize-review-content";

interface ReviewDetailContentProps {
  content: string;
}

export function ReviewDetailContent({ content }: ReviewDetailContentProps) {
  // XSS 공격 방지를 위해 HTML 콘텐츠를 sanitize 처리.
  // sanitize-html은 DOM에 의존하지 않으므로 SSR(검색엔진에 내려가는 HTML)과
  // 클라이언트 리페치 이후 렌더가 동일한 결과를 냅니다.
  const sanitizedContent = sanitizeReviewContent(content);

  return (
    <div
      className="prose prose-stone prose-lg md:prose-xl max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-img:rounded-xl prose-img:shadow-sm prose-blockquote:border-l-4 prose-blockquote:border-stone-200 prose-blockquote:bg-stone-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg"
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
