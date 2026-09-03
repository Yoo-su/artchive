"use client";

import { UsedBookSale } from "@bookjeok/core";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminLayout } from "../../../layouts/admin-layout";
import { api } from "../../../libs/api";
import { requestRevalidate } from "../../../libs/revalidate";


export default function SalesModerationPage() {
  const [sales, setSales] = useState<UsedBookSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [revalidatingId, setRevalidatingId] = useState<number | null>(null);

  async function fetchSales() {
    try {
      const response = await api.get("/book/sales?limit=50");
      // ResponseWrapper 형식 지원
      const fetchedData = response.data.data ? response.data.data : response.data;
      setSales(fetchedData.sales || []);
    } catch (err) {
      console.error("Failed to fetch sales", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 판매글을 삭제하시겠습니까? 사기/스팸 글로 의심되는 경우에만 삭제 조치 하십시오.")) {
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/book/sales/${id}`);
      setSales((prev) => prev.filter((s) => s.id !== id));
      alert("판매글이 성공적으로 삭제되었습니다.");
    } catch (err) {
      console.error("Failed to delete sale", err);
      alert("판매글 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRevalidate = async (id: number) => {
    setRevalidatingId(id);
    const path = `/ko/book/sales/${id}`;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FOR_SALE":
        return (
          <span className="border border-neutral-900 dark:border-neutral-50 px-2 py-0.5 rounded-none font-mono text-[9px] font-semibold text-neutral-900 dark:text-neutral-50 bg-neutral-50 dark:bg-neutral-900">
            판매중
          </span>
        );
      case "RESERVED":
        return (
          <span className="border border-neutral-300 dark:border-neutral-700 text-neutral-500 px-2 py-0.5 rounded-none font-mono text-[9px]">
            예약중
          </span>
        );
      case "SOLD":
        return (
          <span className="border border-transparent text-neutral-400 dark:text-neutral-600 px-2 py-0.5 rounded-none font-mono text-[9px] line-through">
            판매완료
          </span>
        );
      default:
        return (
          <span className="border border-neutral-200 dark:border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-none font-mono text-[9px]">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* 설명 및 타이틀 */}
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-normal font-serif tracking-tight text-neutral-900 dark:text-neutral-50">
              Used Book Market Moderation
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 font-light tracking-wider">
              중고 서적 장터 게시글 실시간 모니터링 및 부적절한 거래글(사기/스팸) 블라인드
            </p>
          </div>
          <span className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 font-mono">
            Total: {sales.length}건
          </span>
        </div>

        {/* 테이블 */}
        <div className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 rounded-none overflow-hidden">
          {loading ? (
            <div className="flex py-20 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-600" />
            </div>
          ) : sales.length === 0 ? (
            <div className="py-20 text-center text-xs text-neutral-400 dark:text-neutral-600 font-light">
              등록된 판매글이 존재하지 않습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-900 text-[10px] tracking-widest uppercase font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
                    <th className="py-4 px-6 font-medium">상태</th>
                    <th className="py-4 px-6 font-medium">도서 정보</th>
                    <th className="py-4 px-6 font-medium">판매글 제목</th>
                    <th className="py-4 px-6 font-medium">판매가</th>
                    <th className="py-4 px-6 font-medium">판매자</th>
                    <th className="py-4 px-6 font-medium">등록일</th>
                    <th className="py-4 px-6 font-medium text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-950 text-xs">
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors"
                    >
                      {/* 상태 */}
                      <td className="py-4 px-6 font-medium">
                        {getStatusBadge(sale.status)}
                      </td>

                      {/* 도서 정보 */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {sale.book?.title || "알 수 없는 도서"}
                        </div>
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light mt-0.5">
                          {sale.book?.author || "저자 정보 없음"}
                        </div>
                      </td>

                      {/* 판매글 제목 */}
                      <td className="py-4 px-6 max-w-xs font-medium text-neutral-900 dark:text-neutral-50 truncate">
                        {sale.title}
                      </td>

                      {/* 판매가 */}
                      <td className="py-4 px-6 font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                        {sale.price.toLocaleString()}원
                      </td>

                      {/* 판매자 */}
                      <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-mono">
                        {sale.user?.nickname || "익명"}
                      </td>

                      {/* 등록일 */}
                      <td className="py-4 px-6 text-neutral-400 dark:text-neutral-600 font-mono">
                        {new Date(sale.createdAt).toLocaleDateString("ko-KR")}
                      </td>

                      {/* 관리 액션 */}
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleRevalidate(sale.id)}
                          disabled={revalidatingId === sale.id}
                          className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-50 border border-neutral-200 dark:border-neutral-800 p-1.5 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
                          title="캐시 즉시 갱신"
                        >
                          {revalidatingId === sale.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(sale.id)}
                          disabled={deletingId === sale.id}
                          className="text-neutral-400 hover:text-red-500 hover:border-red-500 border border-transparent p-1.5 transition-colors disabled:opacity-50"
                          title="판매글 강제 삭제"
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
