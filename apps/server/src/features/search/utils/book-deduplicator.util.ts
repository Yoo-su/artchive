import { BookSearchResultDto } from '../dtos/ai-search.dto';

/**
 * 도서 제목에서 권수 표기, 부제, 괄호 내용 등을 제거하여 대표 작품명으로 정규화
 * 예: "죄와 벌 (상)" -> "죄와 벌", "카라마조프 가의 형제들 1" -> "카라마조프 가의 형제들"
 */
export function normalizeBookTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*[[({<].*?[\])}>]/g, '') // 괄호 및 괄호 내부 텍스트 제거
    .replace(/\s+\d+권?$/g, '') // 끝에 붙은 권수 숫자 제거 (예: " 1권", " 2")
    .replace(/\s+(상|중|하|완결|완|세트)$/g, '') // 상/중/하/세트 표기 제거
    .replace(/[^\w\s가-힣]/g, '') // 특수기호 정돈
    .trim();
}

/**
 * 도서 목록에서 제외 키워드 필터링, 동일 저자의 동일 작품(시리즈, 분권, 중복 판본) 중복 제거,
 * 및 선호 출판사 우선순위 정렬을 수행합니다.
 */
export function deduplicateBooks(
  books: BookSearchResultDto[],
  preferredPublishers?: string[],
  excludedKeywords?: string[],
): BookSearchResultDto[] {
  // 1. 제외 키워드(부정 제약 조건) 필터링
  let baseBooks = books;
  if (excludedKeywords && excludedKeywords.length > 0) {
    const lowerKeywords = excludedKeywords.map((kw) => kw.toLowerCase().trim());
    baseBooks = books.filter((b) => {
      const textToScan =
        `${b.title} ${b.author} ${b.publisher} ${b.description}`.toLowerCase();
      return !lowerKeywords.some(
        (kw) => kw.length > 0 && textToScan.includes(kw),
      );
    });
  }

  // 2. 선호 출판사 우선 정렬
  const sortedBooks = [...baseBooks].sort((a, b) => {
    if (preferredPublishers && preferredPublishers.length > 0) {
      const aMatches = preferredPublishers.some((pub) =>
        a.publisher?.includes(pub),
      );
      const bMatches = preferredPublishers.some((pub) =>
        b.publisher?.includes(pub),
      );
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
    }
    return b.similarity - a.similarity;
  });

  // 3. 작품 단위 중복 제거
  const seenWorkKeys = new Set<string>();
  const deduplicated: BookSearchResultDto[] = [];

  for (const book of sortedBooks) {
    const authorKey = (book.author || '').split(/[,/]/)[0].trim();
    const normalizedTitle = normalizeBookTitle(book.title);
    const workKey = `${authorKey}___${normalizedTitle}`.toLowerCase();

    if (!seenWorkKeys.has(workKey)) {
      seenWorkKeys.add(workKey);
      deduplicated.push(book);
    }
  }

  return deduplicated;
}
