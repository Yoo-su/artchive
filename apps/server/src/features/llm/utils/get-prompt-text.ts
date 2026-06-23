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
  publisher?: string,
) => {
  const publisherTag = publisher
    ? `\n  <publisher>${publisher}</publisher>`
    : '';

  const bookContext = `
<target_book>
  <title>${title}</title>
  <author>${author}</author>${publisherTag}
</target_book>
`;

  const descriptionContext = description
    ? `\n<source_description>\n${description}\n</source_description>`
    : '';

  return `당신은 10년 경력의 전문 도서 큐레이터입니다.
독자가 <target_book>에 정의된 도서를 읽을지 결정하는 데 실질적인 도움을 주는 요약 정보와 인사이트를 제공하는 것이 당신의 목표입니다.

[입력 데이터]
${bookContext}${descriptionContext}

[수행 지침]
1. <target_book>의 정보를 명확히 확인하고, 해당 책에 대한 정확한 요약을 작성하세요.
2. <source_description>이 존재하는 경우 이를 면밀히 분석하되, 소개글 문장을 그대로 복사하지 말고 새로운 시각에서 재해석하여 요약하십시오.
3. 책이 출판된 배경이나 저자의 의도, 책이 타겟 독자에게 주는 가치를 중심으로 구성하십시오.
4. 마크다운 기호(**, *, # 등)는 출력 결과에 절대 사용하지 마십시오.
5. 친절하고 전문적인 존댓말(하십시오체 또는 해요체)을 일관되게 사용하십시오.
6. 각 필드(summary, keyPoints, targetAudience)는 서로 중복되지 않는 고유한 정보를 담아야 합니다.

[출력 형식]
반드시 다음 JSON 형식으로만 응답해야 하며, 다른 텍스트 설명이나 백틱(\`\`\`) 없이 순수 JSON 문자열만 반환하십시오.

{
  "summary": "(해당 책만의 핵심 가치와 읽어야 하는 이유 2~3문장)",
  "keyPoints": [
    "(인사이트 1)",
    "(인사이트 2)",
    "(인사이트 3)"
  ],
  "targetAudience": "(추천하는 독자의 구체적 상황이나 고민)",
  "keywords": ["태그1", "태그2", "태그3", "태그4", "태그5"]
}
`;
};
