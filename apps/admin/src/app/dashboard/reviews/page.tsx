"use client";

import { Review } from "@bookjeok/core";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminLayout } from "../../../layouts/admin-layout";
import { api } from "../../../libs/api";
import { requestRevalidate } from "../../../libs/revalidate";

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [revalidatingId, setRevalidatingId] = useState<number | null>(null);

  async function fetchReviews() {
    try {
      const response = await api.get("/reviews?limit=50");
      // ResponseWrapper 형식 지원
      const fetchedData = response.data.data
        ? response.data.data
        : response.data;
      setReviews(fetchedData.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "정말 이 리뷰를 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      )
    ) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      alert("리뷰가 성공적으로 삭제되었습니다.");
    } catch (err) {
      console.error("Failed to delete review", err);
      alert("리뷰 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRevalidate = async (id: number) => {
    setRevalidatingId(id);
    const path = `/ko/book/reviews/${id}`;

    try {
      await requestRevalidate(path);
      alert(`[${path}] 캐시가 성공적으로 갱신되었습니다.`);
    } catch (err) {
      console.error("Revalidation failed", err);
      alert("캐시 갱신에 실패했습니다.");
    } finally {
      setRevalidatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 설명 및 타이틀 */}
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-normal font-serif tracking-tight text-neutral-900 dark:text-neutral-50">
              Reviews & Book Moderation
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 font-light tracking-wider">
              독자들이 등록한 감상평 모니터링 및 부적절한 게시글 삭제/차단
            </p>
          </div>
          <span className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 font-mono">
            Total: {reviews.length}건
          </span>
        </div>

        {/* 테이블 */}
        <div className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 rounded-none overflow-hidden">
          {loading ? (
            <div className="flex py-20 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-600" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400 dark:text-neutral-600 font-light">
              등록된 리뷰가 존재하지 않습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-900 text-[10px] tracking-widest uppercase font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
                    <th className="py-4 px-6 font-medium">카테고리</th>
                    <th className="py-4 px-6 font-medium">도서 정보</th>
                    <th className="py-4 px-6 font-medium">
                      리뷰 제목 / 내용 요약
                    </th>
                    <th className="py-4 px-6 font-medium">작성자</th>
                    <th className="py-4 px-6 font-medium">등록일</th>
                    <th className="py-4 px-6 font-medium text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-950 text-xs">
                  {reviews.map((review) => (
                    <tr
                      key={review.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors"
                    >
                      {/* 카테고리 */}
                      <td className="py-4 px-6 font-medium text-neutral-500 dark:text-neutral-400">
                        <span className="border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded-none font-mono text-[10px]">
                          {review.category}
                        </span>
                      </td>

                      {/* 도서 정보 */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {review.book?.title || "알 수 없는 도서"}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light mt-0.5">
                          {review.book?.author || "저자 정보 없음"}
                        </div>
                      </td>

                      {/* 리뷰 제목/내용 */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="font-medium text-neutral-900 dark:text-neutral-50 truncate">
                          {review.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light mt-1 line-clamp-2 leading-relaxed">
                          {review.content}
                        </div>
                      </td>

                      {/* 작성자 */}
                      <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-mono">
                        {review.user?.nickname || "익명"}
                      </td>

                      {/* 등록일 */}
                      <td className="py-4 px-6 text-neutral-400 dark:text-neutral-600 font-mono">
                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                      </td>

                      {/* 관리 액션 */}
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleRevalidate(review.id)}
                          disabled={revalidatingId === review.id}
                          className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 border border-neutral-200 dark:border-neutral-800 p-1.5 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                          title="캐시 즉시 갱신"
                        >
                          {revalidatingId === review.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          disabled={deletingId === review.id}
                          className="text-neutral-400 hover:text-red-500 hover:border-red-500 border border-transparent p-1.5 transition-colors disabled:opacity-50"
                          title="리뷰 강제 삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
