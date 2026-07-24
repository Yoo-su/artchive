import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BookSearchResultDto } from '../dtos/ai-search.dto';

@Injectable()
export class RagService {
  private genAI: GoogleGenerativeAI;
  private readonly modelName = 'gemini-1.5-flash';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 사용자 질문과 벡터 검색된 후보 도서 목록을 합성하여
   * 정갈하고 가독성 높은 RAG AI 추천 설명 문구를 생성합니다.
   */
  async generateExplanation(
    query: string,
    books: BookSearchResultDto[],
  ): Promise<string> {
    if (books.length === 0) {
      return '요청하신 검색어와 일치하는 도서를 찾지 못했습니다. 다른 키워드나 문장으로 검색해보세요.';
    }

    const bookSummaries = books
      .slice(0, 5) // 상위 5권에 집중
      .map(
        (b, i) =>
          `${i + 1}. <${b.title}> (저자: ${b.author})\n   소개: ${b.description.slice(0, 150)}...`,
      )
      .join('\n\n');

    const prompt = `사용자가 다음과 같은 생각과 의도로 책을 추천해 달라고 요청했습니다:
"${query}"

의미 기반 데이터베이스 검색 결과, 아래 책들이 가장 유사한 후보로 추출되었습니다:

${bookSummaries}

[지침]
1. 사용자의 요청 의도와 추천된 책들의 분위기/내용을 자연스럽게 연결하여 추천 이유를 작성해주세요.
2. 사용자의 질문이 독서/도서 추천과 전혀 무관한 일반 질의(예: 주식, 날씨, 프로그래밍 코드 요청 등)인 경우, 도서 추천 전용 서비스임을 단정하게 안내하고 독서 주제로 다시 검색하도록 유도해주세요.
3. 구체적이고 정갈한 한국어 3~4문장 내외로 설명해주세요.
4. 캐릭터 페르소나나 촌스러운 이모지/말투는 절대 사용하지 말고, 미니멀하고 단정한 독서 플랫폼에 어울리는 정갈한 톤앤매너로 작성해주세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.5,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return (
        text.trim() ||
        '사용자님의 질문에 꼭 들어맞는 감성과 서사를 담은 도서들을 엄선하여 추천해 드립니다.'
      );
    } catch (error) {
      console.error('RAG Explanation Generation Error:', error);
      return `"${query}" 요청에 잘 어울리는 주제와 서사를 다룬 추천 도서 목록입니다. 각 책의 상세 내용을 확인해 보세요.`;
    }
  }
}
