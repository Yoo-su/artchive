"use client";

import { useEffect, useMemo } from "react";
import { useInView } from "react-intersection-observer";

import { Spinner } from "@/shared/components/shadcn/spinner";

import { useUserLocation } from "../../hooks/use-user-location";
import { useInfiniteBookSalesQuery } from "../../queries";
import { SearchBookSalesParams } from "../../types";
import { BookSaleCard } from "../book-sale-card";

interface BookSaleGridProps {
  filterParams: SearchBookSalesParams;
}

export const BookSaleGrid = ({ filterParams }: BookSaleGridProps) => {
  const isDistanceSort = filterParams.sortBy === "distance";

  // 거리순일 때 위치 정보 관리
  const {
    location,
    status: locationStatus,
    errorMessage: locationError,
    requestLocation,
  } = useUserLocation();

  // 거리순 선택 시 자동으로 위치 요청
  useEffect(() => {
    if (isDistanceSort && !location && locationStatus === "idle") {
      requestLocation();
    }
  }, [isDistanceSort, location, locationStatus, requestLocation]);

  // 쿼리에 전달할 파라미터 (거리순일 때만 lat/lng 추가)
  const queryParams: SearchBookSalesParams = useMemo(() => {
    if (isDistanceSort && location) {
      return {
        ...filterParams,
        lat: location.lat,
        lng: location.lng,
        radius: 5000, // 기본 반경 5km
      };
    }
    return filterParams;
  }, [filterParams, isDistanceSort, location]);

  // 거리순인데 위치가 없으면 쿼리 비활성화
  const queryEnabled = !isDistanceSort || !!location;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteBookSalesQuery(queryParams);

  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  // 무한 스크롤을 위한 로직
  useEffect(() => {
    if (inView && hasNextPage && !isFetching && queryEnabled) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, fetchNextPage, queryEnabled]);

  const sales = data?.pages.flatMap((page) => page.sales) || [];

  // 거리순인데 위치 로딩 중
  if (isDistanceSort && locationStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner />
        <p className="text-stone-500">위치 정보를 가져오는 중...</p>
      </div>
    );
  }

  // 거리순인데 위치 권한 거부됨
  if (isDistanceSort && locationStatus === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <p className="text-red-500">{locationError}</p>
        <button
          onClick={requestLocation}
          className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 첫 페이지 로딩 중일 때 스켈레톤 UI 표시
  if (isFetching && !isFetchingNextPage && !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <BookSaleCard.Skeleton key={i} />
        ))}
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        <p>데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  // 검색 결과가 없을 때
  if (sales.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <p>해당 조건에 맞는 판매글이 없습니다.</p>
      </div>
    );
  }

  // 성공적으로 데이터를 가져왔을 때
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sales.map((sale, idx) => (
          <BookSaleCard
            key={sale.id}
            idx={idx}
            sale={sale}
            priority={idx < 3}
          />
        ))}
      </div>

      {/* 다음 페이지를 불러오기 위한 트리거 요소 */}
      <div ref={ref} className="h-10" />

      {/* 다음 페이지 로딩 중일 때 스피너 표시 */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-6">
          <Spinner />
        </div>
      )}
    </div>
  );
};
