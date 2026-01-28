import { SceneData } from "@/features/intro/types";

export const SCENES: SceneData[] = [
  {
    id: "record",
    header: "기록이\n기억이 될 때",
    sub: "나만의 독서 기록장",
    desc: "모든 독서는 기록하는 순간\n나의 역사가 됩니다",
    accentClass: "text-stone-900",
  },
  {
    id: "used",
    header: "잠든 책을\n깨우는 시간",
    sub: "우리 동네 중고 거래",
    desc: "내 서재의 멈춰진 이야기가\n누군가의 새로운 시작이 됩니다",
    accentClass: "text-slate-900",
  },
  {
    id: "review",
    header: "취향은\n전염되니까",
    sub: "믿고 보는 도서 리뷰",
    desc: "솔직한 감상과 별점이 모여\n더 정확한 선택을 돕습니다",
    accentClass: "text-zinc-900",
  },
];
