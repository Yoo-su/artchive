import { Skeleton } from "@/shared/components/shadcn/skeleton";

// 공연 상세 페이지 로딩 스켈레톤
export const ArtDetailSkeleton = () => (
  <div className="w-full animate-pulse bg-stone-50 min-h-screen">
    {/* 히어로 섹션 스켈레톤 */}
    <div className="relative min-h-[500px] lg:min-h-[600px] bg-white overflow-hidden">
      {/* 포스터 배경 */}
      <div className="absolute inset-0 lg:w-2/3">
        <Skeleton className="w-full h-full bg-stone-100" />
      </div>

      {/* 그라디언트 오버레이 */}
      <div className="hidden lg:block absolute inset-0 bg-linear-to-r from-transparent via-white/70 to-white" />

      {/* 콘텐츠 영역 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 h-full">
        <div className="flex flex-col lg:flex-row lg:items-center min-h-[500px] lg:min-h-[600px]">
          <div className="hidden lg:block lg:w-1/3" />
          <div className="flex-1 py-10 lg:py-16 lg:pl-12">
            <div className="max-w-lg space-y-4">
              {/* 장르/상태 텍스트 */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-14 bg-stone-200" />
                <Skeleton className="h-4 w-12 bg-stone-200" />
              </div>

              {/* 타이틀 */}
              <Skeleton className="h-12 w-4/5 bg-stone-200" />
              <Skeleton className="h-10 w-3/5 bg-stone-200" />

              {/* 장소 */}
              <Skeleton className="h-6 w-1/2 bg-stone-100" />

              {/* 간략 정보 */}
              <div className="flex items-center gap-6 mt-6">
                <Skeleton className="h-12 w-32 bg-stone-100" />
                <Skeleton className="h-12 w-24 bg-stone-100" />
              </div>

              {/* 예매 링크 */}
              <Skeleton className="h-5 w-24 bg-stone-200 mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* 콘텐츠 섹션 스켈레톤 */}
    <div className="max-w-6xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Skeleton className="h-4 w-24 bg-stone-100" />
        <Skeleton className="h-64 w-full bg-stone-100" />
        <Skeleton className="h-4 w-20 bg-stone-100" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-stone-100" />
          <Skeleton className="h-4 w-full bg-stone-100" />
          <Skeleton className="h-4 w-5/6 bg-stone-100" />
        </div>
      </div>
      <div className="space-y-0">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="py-4 border-b border-stone-100">
            <Skeleton className="h-3 w-16 bg-stone-100 mb-2" />
            <Skeleton className="h-5 w-3/4 bg-stone-100" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
