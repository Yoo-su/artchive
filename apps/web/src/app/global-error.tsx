"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

import { config } from "@/shared/config/env";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root Global Error Boundary
 * 루트 레이아웃(app/[locale]/layout.tsx) 레벨의 크래시 발생 시
 * 흰 화면을 방지하고 복구 액션을 제공하는 Next.js 공식 최상위 에러 바운더리입니다.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Root Global Error]:", error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased font-sans flex flex-col items-center justify-center p-4 selection:bg-amber-100">
        {/* 장식용 은은한 배경 블러 그라데이션 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-stone-200/50 rounded-full blur-3xl" />
        </div>

        <main className="w-full max-w-md mx-auto flex flex-col items-center text-center">
          {/* 에러 카드 */}
          <div className="w-full bg-white/80 backdrop-blur-xl border border-stone-200/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-stone-200/60 transition-all">
            {/* 아이콘 */}
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-6 text-amber-700 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            {/* 타이틀 */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-3">
              일시적인 오류가 발생했습니다
            </h1>

            {/* 설명 */}
            <p className="text-sm text-stone-600 leading-relaxed mb-8">
              페이지를 불러오는 도중 예기치 못한 문제가 발생했습니다.
              <br className="hidden sm:inline" /> 아래 버튼을 눌러 다시 시도해주세요.
            </p>

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-all shadow-md shadow-stone-900/10 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도하기
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-700 hover:text-stone-900 text-sm font-medium border border-stone-200/80 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                홈으로 이동
              </button>
            </div>

            {/* 개발자용 디버그 스택 (Dev 환경) */}
            {config.isDev && (
              <details className="mt-8 text-left bg-stone-900/5 rounded-xl border border-stone-200/60 p-3.5">
                <summary className="cursor-pointer text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors">
                  개발자 디버그 정보 (클릭하여 확인)
                </summary>
                <div className="mt-2.5 overflow-x-auto rounded-lg bg-stone-950 p-3 text-[11px] text-red-300 font-mono leading-relaxed whitespace-pre-wrap">
                  <p className="font-bold text-red-400">
                    {error.name}: {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-stone-400 mt-1">Digest: {error.digest}</p>
                  )}
                  {error.stack && (
                    <p className="text-stone-500 mt-2 text-[10px]">
                      {error.stack}
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>

          {/* 푸터 */}
          <footer className="mt-8 text-xs text-stone-400 font-light">
            © Bookjeok. All rights reserved.
          </footer>
        </main>
      </body>
    </html>
  );
}
