/**
 * 검색어 정규화 유틸 함수
 *
 * 정규화 규칙:
 * 1. 앞뒤 공백 제거 (trim)
 * 2. 연속 공백을 단일 공백으로 치환
 * 3. 한글 초성만 있는 글자 제거 (ㄱ, ㄴ, ㄷ, ..., ㅎ)
 * 4. 최소 2글자 이상이어야 유효 (그 미만은 null 반환)
 *
 * @param raw 원본 검색어
 * @returns 정규화된 검색어, 또는 유효하지 않은 경우 null
 *
 * @example
 * normalizeKeyword("  민음사  ") // "민음사"
 * normalizeKeyword("민음ㅅ")     // "민음" (2글자 이상이므로 유효)
 * normalizeKeyword("ㅅ")         // null (1글자 미만)
 * normalizeKeyword("   ")        // null (공백만)
 */
export function normalizeKeyword(raw: string): string | null {
  // 1. trim + 연속 공백 정리
  let normalized = raw.trim().replace(/\s+/g, ' ');

  // 2. 한글 초성만 있는 글자 제거 (ㄱ-ㅎ)
  normalized = normalized.replace(/[ㄱ-ㅎ]/g, '');

  // 3. 정규화 후 다시 trim (초성 제거로 인한 공백 정리)
  normalized = normalized.trim().replace(/\s+/g, ' ');

  // 4. 2글자 미만이면 무효
  if (normalized.length < 2) {
    return null;
  }

  return normalized;
}
