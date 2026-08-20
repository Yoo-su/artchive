"use client";

import { getErrorMessage } from "@bookjeok/api-client";
import axios from "axios";
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Send } from "lucide-react";
import { useState } from "react";


import { AdminLayout } from "../../../layouts/admin-layout";

interface ISRPage {
  name: string;
  path: string;
  revalidateTime: string;
  description: string;
}

export default function CacheControlPage() {
  const [customPath, setCustomPath] = useState("");
  const [loadingPath, setLoadingPath] = useState<string | null>(null);
  const [status, setStatus] = useState<{ path: string; success: boolean; msg: string } | null>(null);

  const userWebUrl = process.env.NEXT_PUBLIC_USER_WEB_URL || "http://localhost:3000";
  const revalidateToken = process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || "yoosurevalidatetoken";

  const isrPages: ISRPage[] = [
    { name: "메인 홈 (ko)", path: "/ko", revalidateTime: "1시간", description: "베스트셀러, 실시간 인기 도서 노출" },
    { name: "메인 홈 (en)", path: "/en", revalidateTime: "1시간", description: "영문 메인 홈 화면" },
    { name: "독서 라운지 (ko)", path: "/ko/lounge", revalidateTime: "1시간", description: "최신 독서 피드 및 열성 독서가" },
    { name: "독서 라운지 (en)", path: "/en/lounge", revalidateTime: "1시간", description: "영문 독서 라운지" },
    { name: "중고 장터 목록 (ko)", path: "/ko/book/market", revalidateTime: "1시간", description: "최근 등록 매물 및 인기 판매글" },
    { name: "중고 장터 목록 (en)", path: "/en/book/market", revalidateTime: "1시간", description: "영문 중고 거래 목록" },
    { name: "도서 리뷰 목록 (ko)", path: "/ko/book/reviews", revalidateTime: "1시간", description: "독자 리뷰 피드 및 실시간 목록" },
    { name: "도서 리뷰 목록 (en)", path: "/en/book/reviews", revalidateTime: "1시간", description: "영문 도서 리뷰 피드" },
    { name: "도서 검색 페이지 (ko)", path: "/ko/book/search", revalidateTime: "1시간", description: "통합 도서 검색 결과" },
    { name: "도서 검색 페이지 (en)", path: "/en/book/search", revalidateTime: "1시간", description: "영문 통합 도서 검색" },
    { name: "서비스 인사이트 (ko)", path: "/ko/insights", revalidateTime: "6시간", description: "서비스 누적 분석 및 차트 현황" },
    { name: "서비스 인사이트 (en)", path: "/en/insights", revalidateTime: "6시간", description: "영문 서비스 분석 현황" },
  ];

  const handleRevalidate = async (path: string) => {
    setLoadingPath(path);
    setStatus(null);

    try {
      // 사용자용 웹 서비스의 Revalidation 웹훅 호출
      const response = await axios.post(
        `${userWebUrl}/api/revalidate?secret=${revalidateToken}&path=${encodeURIComponent(path)}`
      );

      if (response.data.revalidated) {
        setStatus({
          path,
          success: true,
          msg: `성공적으로 캐시가 비워졌습니다. (발생 시각: ${new Date(response.data.now).toLocaleTimeString()})`,
        });
      } else {
        setStatus({
          path,
          success: false,
          msg: "캐시 갱신에 실패했습니다.",
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatus({
        path,
        success: false,
        msg: getErrorMessage(err, "캐시 갱신 중 에러가 발생했습니다."),
      });
    } finally {
      setLoadingPath(null);
    }
  };


  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPath.startsWith("/")) {
      alert("경로는 반드시 '/'로 시작해야 합니다. (예: /ko/book/9788937460753/detail)");
      return;
    }
    handleRevalidate(customPath);
  };

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* 타이틀 및 설명 */}
        <div>
          <h3 className="text-xl font-normal font-serif tracking-tight text-neutral-900 dark:text-neutral-50">
            ISR Cache Invalidation / 캐시 즉시 비우기
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 font-light tracking-wider">
            Vercel Edge 네트워크와 Next.js 서버의 페이지 단위 ISR 캐시를 실시간으로 강제 파괴하고 다시 로드합니다.
          </p>
        </div>

        {/* 결과 피드백 배너 */}
        {status && (
          <div
            className={`border p-4 flex items-start gap-3 rounded-none transition-all duration-300 ${
              status.success
                ? "border-neutral-900 dark:border-neutral-50 bg-neutral-50 dark:bg-neutral-900/30"
                : "border-red-500 dark:border-red-900 bg-red-50/20"
            }`}
          >
            {status.success ? (
              <CheckCircle className="h-5 w-5 text-neutral-900 dark:text-neutral-50 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="text-xs font-semibold tracking-wider font-mono">
                TARGET PATH: {status.path}
              </div>
              <div className="text-xs font-light text-neutral-600 dark:text-neutral-400">
                {status.msg}
              </div>
            </div>
          </div>
        )}

        {/* 2열 구조: 정적 목록 vs 커스텀 경로 입력 */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* 정적 페이지 목록 */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 font-mono">
                Static Pages / 주요 고정 페이지 캐시 제어
              </h4>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 rounded-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-900 text-[10px] tracking-widest uppercase font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
                      <th className="py-4 px-5">페이지 명</th>
                      <th className="py-4 px-5">접속 경로</th>
                      <th className="py-4 px-5">캐시 만료 주기</th>
                      <th className="py-4 px-5 text-right">제어</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-950 text-xs">
                    {isrPages.map((page, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-semibold text-neutral-800 dark:text-neutral-200">{page.name}</div>
                          <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-light mt-0.5">
                            {page.description}
                          </div>
                        </td>
                        <td className="py-4 px-5 font-mono text-neutral-600 dark:text-neutral-400">
                          {page.path}
                        </td>
                        <td className="py-4 px-5 font-mono text-neutral-500">
                          {page.revalidateTime}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleRevalidate(page.path)}
                            disabled={loadingPath !== null}
                            className="inline-flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-50 px-3 py-1.5 text-[10px] tracking-wider uppercase font-medium transition-all duration-300 disabled:opacity-50"
                          >
                            {loadingPath === page.path ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            갱신
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 커스텀 및 동적 페이지 캐시 제어 */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 font-mono">
                Target Revalidate / 특정 상세페이지 강제 갱신
              </h4>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 rounded-none space-y-6">
              <form onSubmit={handleCustomSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] tracking-wider uppercase font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
                    경로 입력 (Path)
                  </label>
                  <input
                    type="text"
                    required
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="/ko/book/9788937460753/detail"
                    className="w-full border border-neutral-200 dark:border-neutral-800 bg-transparent py-2.5 px-3 text-xs outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-50 text-neutral-900 dark:text-neutral-50 placeholder-neutral-300 dark:placeholder-neutral-700"
                  />
                  <p className="text-[9px] text-neutral-400 dark:text-neutral-600 font-light leading-relaxed">
                    * 국문 도서 상세: <code className="font-mono bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5">/ko/book/[ISBN]/detail</code><br />
                    * 국문 리뷰 상세: <code className="font-mono bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5">/ko/book/reviews/[ID]</code><br />
                    * 국문 중고 상세: <code className="font-mono bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5">/ko/book/sales/[ID]</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loadingPath !== null}
                  className="w-full inline-flex items-center justify-center gap-2 border border-neutral-900 dark:border-neutral-50 bg-neutral-900 dark:bg-neutral-50 hover:bg-white dark:hover:bg-neutral-950 text-white dark:text-neutral-950 hover:text-neutral-900 dark:hover:text-neutral-50 py-3 text-[10px] tracking-widest font-medium uppercase transition-all duration-300 disabled:opacity-50"
                >
                  {loadingPath === customPath ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      갱신 요청 중...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      캐시 비우기
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
