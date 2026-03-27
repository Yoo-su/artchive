export const BOOK_DOMAINS = [
  "소설",
  "에세이",
  "자기계발",
  "인문",
  "경제/경영",
  "과학",
  "예술",
  "역사",
  "철학",
  "종교",
  "만화",
  "기타",
] as const;

export type BookDomain = (typeof BOOK_DOMAINS)[number];

export const CATEGORY_MAP: Record<string, string> = {
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
