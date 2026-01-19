"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Flame } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { usePopularKeywordsQuery } from "../../../queries";

/**
 * 인기 검색어 컴포넌트
 *
 * 기능:
 * - 3초 간격으로 인기 검색어가 슬라이드업 애니메이션으로 전환
 * - hover 시 전체 Top 10 목록이 드롭다운으로 표시
 * - 검색어 클릭 시 해당 검색어로 즉시 검색
 */
export const PopularKeywords = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: keywords = [], isLoading } = usePopularKeywordsQuery();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 3초마다 다음 검색어로 전환 (hover 시 일시정지)
  useEffect(() => {
    if (keywords.length <= 1 || isHovered || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % keywords.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [keywords.length, isHovered, isPaused]);

  // 검색어 클릭 핸들러
  const handleKeywordClick = useCallback(
    (keyword: string) => {
      const params = new URLSearchParams();
      params.set("q", keyword);
      router.push(`${pathname}?${params.toString()}`);
      setIsHovered(false);
    },
    [router, pathname],
  );

  // 로딩 중이거나 데이터가 없으면 렌더링하지 않음
  if (isLoading || keywords.length === 0) {
    return null;
  }

  const currentKeyword = keywords[currentIndex];

  return (
    <div
      className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-full border border-orange-100 cursor-pointer transition-all hover:shadow-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 불꽃 아이콘 */}
      <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />

      {/* 라벨 */}
      <span className="text-xs text-orange-600 font-medium whitespace-nowrap">
        인기
      </span>

      {/* 슬라이드업 애니메이션 영역 */}
      <div className="relative h-5 overflow-hidden min-w-[80px]">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 text-sm font-medium text-gray-800 truncate"
            onClick={() => handleKeywordClick(currentKeyword.keyword)}
          >
            {currentKeyword.keyword}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* 드롭다운 화살표 */}
      <ChevronDown
        className={`w-4 h-4 text-gray-400 transition-transform ${
          isHovered ? "rotate-180" : ""
        }`}
      />

      {/* Hover 드롭다운 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* 헤더 */}
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-800">
                  인기 검색어 TOP {keywords.length}
                </span>
              </div>
            </div>

            {/* 검색어 목록 */}
            <ul className="py-2 max-h-80 overflow-y-auto">
              {keywords.map((item, index) => (
                <li key={item.keyword}>
                  <button
                    type="button"
                    onClick={() => handleKeywordClick(item.keyword)}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      index === currentIndex ? "bg-orange-50" : ""
                    }`}
                  >
                    {/* 순위 */}
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        index < 3
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>

                    {/* 키워드 */}
                    <span className="flex-1 text-left text-sm text-gray-700 truncate">
                      {item.keyword}
                    </span>

                    {/* 검색 횟수 */}
                    <span className="text-xs text-gray-400">
                      {item.searchCount.toLocaleString()}회
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
