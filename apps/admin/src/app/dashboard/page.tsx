"use client";

import { InsightsResponse } from "@bookjeok/core";
import { BookOpen, Hash, Heart, Loader2, ShoppingBag, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminLayout } from "../../layouts/admin-layout";
import { api } from "../../libs/api";

export default function DashboardPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchInsights() {
      try {
        const response = await api.get("/insights");
        // ResponseWrapper 구조 대응
        setData(response.data.data ? response.data.data : response.data);
      } catch (err) {
        console.error("Failed to load dashboard insights", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400 dark:text-neutral-600" />
        </div>
      </AdminLayout>
    );
  }

  const summary = data?.summary || {
    totalSales: 0,
    totalReviews: 0,
    totalReactions: 0,
    totalTags: 0,
  };

  const statCards = [
    { title: "등록된 중고 도서", value: `${summary.totalSales.toLocaleString()}건`, desc: "누적 중고 장터 매물", icon: ShoppingBag },
    { title: "작성된 독서 리뷰", value: `${summary.totalReviews.toLocaleString()}건`, desc: "사용자 누적 감상평", icon: BookOpen },
    { title: "누적 공감 반응", value: `${summary.totalReactions.toLocaleString()}개`, desc: "리뷰/글 피드백 리액션", icon: Heart },
    { title: "등록된 해시태그", value: `${summary.totalTags.toLocaleString()}개`, desc: "리뷰 분류용 태그 수", icon: Hash },
  ];

  return (
    <AdminLayout>
      <div className="space-y-10">
        {/* 설명 및 타이틀 */}
        <div>
          <h3 className="text-xl font-normal font-serif tracking-tight text-neutral-900 dark:text-neutral-50">
            Overview
          </h3>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5 font-light tracking-wider">
            서비스 전반의 실시간 누적 활동량 지표
          </p>
        </div>

        {/* 통계 그리드 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 rounded-none flex flex-col justify-between h-36 hover:border-neutral-900 dark:hover:border-neutral-50 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-neutral-400 dark:text-neutral-500 font-mono">
                    {card.title}
                  </span>
                  <Icon className="h-4 w-4 text-neutral-300 dark:text-neutral-700" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-normal font-mono tracking-tight text-neutral-950 dark:text-neutral-50">
                    {card.value}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-600 font-light">
                    {card.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 그리드: 인기 태그와 관리 기능 바로가기 */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* 인기 태그 랭킹 */}
          <div className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 rounded-none space-y-6">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 font-mono">
                Popular Hashtags / 인기 태그 순위
              </h4>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1 font-light">
                가장 많이 등록된 상위 태그 목록
              </p>
            </div>
            <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
              {data?.popularTags && data.popularTags.length > 0 ? (
                data.popularTags.slice(0, 5).map((tag, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3 text-xs">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                      #{tag.name}
                    </span>
                    <span className="font-mono text-neutral-400 dark:text-neutral-600">
                      {tag.count}회 사용됨
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-600 font-light">
                  데이터가 존재하지 않습니다.
                </div>
              )}
            </div>
          </div>

          {/* 퀵 엑세스 */}
          <div className="border border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950 p-6 rounded-none space-y-6">
            <div>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-neutral-400 dark:text-neutral-500 font-mono">
                Quick Access / 빠른 링크
              </h4>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-600 mt-1 font-light">
                관리 기능 페이지로 빠른 이동
              </p>
            </div>
            <div className="grid gap-3">
              <a
                href="/dashboard/reviews"
                className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 hover:border-neutral-950 dark:hover:border-neutral-50 p-4 text-xs font-medium tracking-wider uppercase transition-all duration-300"
              >
                도서 리뷰 모니터링 및 블라인드
                <span className="text-[10px] font-mono text-neutral-400">&rarr;</span>
              </a>
              <a
                href="/dashboard/sales"
                className="flex items-center justify-between border border-neutral-200 dark:border-neutral-800 hover:border-neutral-950 dark:hover:border-neutral-50 p-4 text-xs font-medium tracking-wider uppercase transition-all duration-300"
              >
                중고마켓 사기/스팸 게시물 처리
                <span className="text-[10px] font-mono text-neutral-400">&rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
