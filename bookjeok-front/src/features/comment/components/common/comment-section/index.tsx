"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useInView } from "react-intersection-observer";

import { CommentTargetType } from "../../../types";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";

interface CommentSectionProps {
  targetType: CommentTargetType;
  targetId: string;
}

/**
 * 댓글 섹션 메인 컨테이너
 * 댓글 목록과 작성 폼을 포함합니다.
 */
export const CommentSection = ({
  targetType,
  targetId,
}: CommentSectionProps) => {
  const [page, setPage] = useState(1);
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "200px" });
  const t = useTranslations("comment");

  return (
    <section ref={ref} className="py-12">
      <h2 className="text-xl font-serif tracking-tight mb-6 text-stone-600">
        {t("title")}
      </h2>

      {/* 댓글 작성 폼 */}
      <CommentForm targetType={targetType} targetId={targetId} />

      {/* 댓글 목록 */}
      <CommentList
        targetType={targetType}
        targetId={targetId}
        page={page}
        onPageChange={setPage}
        enabled={inView}
      />
    </section>
  );
};
