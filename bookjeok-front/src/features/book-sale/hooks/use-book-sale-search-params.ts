"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { SaleStatus, SearchBookSalesParams } from "../types";

/**
 * URL search params에서 중고책 검색 필터를 추출하는 훅
 * 참고: lat/lng는 URL에 포함하지 않고 useUserLocation 훅에서 관리합니다.
 */
export const useBookSaleSearchParams = (): SearchBookSalesParams => {
  const searchParams = useSearchParams();

  const filterParams: SearchBookSalesParams = useMemo(() => {
    const params: SearchBookSalesParams = {};
    const search = searchParams.get("search");
    const city = searchParams.get("city");
    const district = searchParams.get("district");
    const status = searchParams.getAll("status") as SaleStatus[];
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");

    if (search) params.search = search;
    if (city) params.city = city;
    if (district) params.district = district;
    if (status.length > 0) params.status = status;
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);

    return params;
  }, [searchParams]);

  return filterParams;
};
