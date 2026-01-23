/**
 * 강력한 JSON 추출기 (Robust JSON Extractor)
 * 1. 원본 텍스트 파싱 시도
 * 2. 마크다운 코드 블록(```json ... ```) 추출 시도
 * 3. 가장 바깥쪽 중괄호({ ... }) 추출 시도
 *
 * @param text JSON을 포함하고 있을 수 있는 문자열
 * @returns 파싱된 제네릭 타입 T 객체
 * @throws Error 파싱에 실패했을 경우
 */
export function extractJson<T>(text: string): T {
  // 1. 원본 텍스트 파싱 시도
  try {
    return JSON.parse(text) as T;
  } catch {
    // 에러 무시하고 다음 단계 시도
  }

  // 2. 마크다운 코드 블록 시도
  const match = text.match(/```(?:json)?([\s\S]*?)```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]) as T;
    } catch {
      // 에러 무시하고 다음 단계 시도
    }
  }

  // 3. 가장 바깥쪽 중괄호 찾기 시도
  const firstOpen = text.indexOf('{');
  const lastClose = text.lastIndexOf('}');
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    const jsonStr = text.substring(firstOpen, lastClose + 1);
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      // 에러 무시
    }
  }

  throw new Error('Failed to extract JSON from response');
}
