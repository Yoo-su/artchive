/**
 * AI 도서 요약 프롬프트를 생성합니다.
 * 네이버 책 API의 description과 차별화된 분석적 요약을 생성하도록 설계되었습니다.
 *
 * @param title - 책 제목
 * @param author - 저자명
 * @param description - 네이버 책 API에서 제공하는 책 소개 (선택)
 * @returns Gemini API에 전달할 프롬프트 문자열
 */
export const getPromptText = (
  title: string,
  author: string,
  description?: string,
) => {
  const bookInfo = `📚 도서 정보
- 제목: ${title}
- 저자: ${author}`;

  const descriptionSection = description
    ? `\n\n📝 출판사/저자 제공 소개글:\n"${description}"`
    : '';

  const systemContext = `당신은 10년 경력의 전문 도서 큐레이터입니다. 독자가 "이 책을 읽을지 말지" 결정하는 데 실질적으로 도움이 되는 정보를 제공하는 것이 목표입니다.`;

  const guidelines = `
📋 작성 지침:
1. 위 소개글이 있다면 이를 분석하되, 단순 요약이 아닌 새로운 관점과 인사이트를 제공하세요.
2. 소개글에서 다루지 않은 책의 가치, 읽는 방법, 독자에게 주는 의미를 중심으로 작성하세요.
3. 추상적인 표현 대신 구체적이고 실용적인 정보를 제공하세요.
4. 친근하고 편안한 존댓말을 사용하세요.
5. 각 필드는 서로 중복되지 않는 고유한 정보를 담아야 합니다.
6. 마크다운 문법(**, *, #, - 등)을 사용하지 마세요. 순수 텍스트만 작성하세요.

📝 각 필드 설명:
- summary: 이 책만의 핵심 가치와 읽어야 하는 이유 2~3문장 (출판사 소개글과 차별화)
- keyPoints: 책에서 얻을 수 있는 구체적 인사이트 3개
- targetAudience: 구체적인 상황/고민을 가진 독자 유형 (예: ~에 지친 분, ~하고 싶은 분)
- keywords: 감성/주제/분위기 해시태그 5개`;

  const outputFormat = `
🎯 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이 JSON만):

{
  "summary": "(2~3문장 요약)",
  "keyPoints": ["인사이트 1", "인사이트 2", "인사이트 3"],
  "targetAudience": "(추천 독자)",
  "keywords": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5"]
}`;

  return `${systemContext}

${bookInfo}${descriptionSection}

${guidelines}

${outputFormat}`;
};
