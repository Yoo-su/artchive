"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { BOOK_DOMAINS } from "@/features/review/constants";
import { Badge } from "@/shared/components/shadcn/badge";
import { Button } from "@/shared/components/shadcn/button";
import { Input } from "@/shared/components/shadcn/input";
import { cn } from "@/shared/utils";

const CATEGORY_MAP: Record<string, string> = {
  소설: "novel",
  에세이: "essay",
  자기계발: "self_help",
  인문: "humanities",
  "경제/경영": "economy",
  과학: "science",
  예술: "art",
  역사: "history",
  철학: "philosophy",
  종교: "religion",
  만화: "comic",
  기타: "others",
};

interface ReviewHomeFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  isFiltered: boolean;
  clearFilters: () => void;
  selectedCategory: string | null;
  handleCategoryClick: (category: string) => void;
}

export function ReviewHomeFilters({
  searchInput,
  setSearchInput,
  handleSearch,
  isFiltered,
  clearFilters,
  selectedCategory,
  handleCategoryClick,
}: ReviewHomeFiltersProps) {
  const t = useTranslations("review.filters");

  return (
    <section className="container mx-auto mb-12 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("placeholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 pr-4 h-12 rounded-full border-stone-200 focus-visible:ring-stone-400"
          />
        </form>
        {isFiltered && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="shrink-0 rounded-full border-stone-300 hover:bg-stone-100"
          >
            <X className="w-4 h-4 mr-2" />
            {t("reset")}
          </Button>
        )}
      </div>

      <div className="w-full">
        <Swiper
          modules={[FreeMode]}
          spaceBetween={8}
          slidesPerView="auto"
          freeMode={true}
          className="w-full"
        >
          {BOOK_DOMAINS.map((category) => (
            <SwiperSlide key={category} className="w-auto! select-none">
              <Badge
                variant={selectedCategory === category ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-4 py-1.5 text-sm font-normal transition-colors hover:bg-stone-100",
                  selectedCategory === category && "hover:bg-primary/90",
                )}
                onClick={() => handleCategoryClick(category)}
              >
                {t(`categories.${CATEGORY_MAP[category]}`)}
              </Badge>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
