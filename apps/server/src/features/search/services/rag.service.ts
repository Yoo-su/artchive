import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  BookSearchResultDto,
  ChatMessageDto,
  ChatRole,
} from '@/features/search/dtos/ai-search.dto';

export interface IntentAnalysisResult {
  needSearch: boolean;
  searchQuery: string;
  followUpMessage?: string;
}

@Injectable()
export class RagService {
  private genAI: GoogleGenerativeAI;
  private readonly modelName = 'gemini-1.5-flash';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * 대화 이력을 분석하여 (1) 책 추천을 위해 DB 벡터 검색이 필요한지,
   * (2) 필요하다면 임베딩할 최적의 검색 쿼리를 재구성(Query Rewriting)하고,
   * (3) 부족하다면 유저에게 되물을 꼬리 질문을 판단합니다.
   */
  async analyzeIntentAndQuery(
    messages: ChatMessageDto[],
  ): Promise<IntentAnalysisResult> {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === ChatRole.USER)?.content;

    if (!lastUserMessage) {
      return {
        needSearch: false,
        searchQuery: '',
        followUpMessage:
          '안녕하세요! 어떤 책을 찾으시는지 편안하게 말씀해 주세요.',
      };
    }

    const conversationHistory = messages
      .map((m) => `${m.role === ChatRole.USER ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');

    const prompt = `당신은 독서 플랫폼의 AI 도서 큐레이션 전문가입니다.
아래 대화 기록을 보고, 사용자가 책 추천을 원하고 있는지 혹은 정보가 더 필요한 단계인지 판단하세요.

[대화 기록]
${conversationHistory}

[지침]
1. 사용자의 최근 메시지가 인사, 단순 잡담, 또는 '책 추천해줘'처럼 추천받고 싶은 장르/주제/상황 정보가 전혀 없는 모호한 말일 경우:
   - needSearch: false
   - followUpMessage: 유저에게 어떤 기분, 장르, 또는 상황의 책을 찾고 있는지 친근하고 단정하게 되묻는 질문 문구
   - searchQuery: ""

2. 사용자가 읽고 싶은 분위기, 감정, 주제, 장르를 밝혔거나, "아까 2번 책 말고 다른 에세이로 재추천해줘"처럼 조건 변경/추가 추천을 요청한 경우:
   - needSearch: true
   - searchQuery: 768차원 도서 DB 벡터 검색에 사용할 명확하고 풍부한 한국어 키워드 문장 (예: "퇴근길 조용히 읽기 좋은 따뜻한 감성 에세이")
   - followUpMessage: ""

[응답 형식]
JSON 형식으로 응답하세요.`;

    const jsonSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        needSearch: { type: SchemaType.BOOLEAN },
        searchQuery: { type: SchemaType.STRING },
        followUpMessage: { type: SchemaType.STRING },
      },
      required: ['needSearch', 'searchQuery', 'followUpMessage'],
    };

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: jsonSchema,
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const parsed = JSON.parse(text) as IntentAnalysisResult;
      return parsed;
    } catch (error) {
      console.error('Intent Analysis Error:', error);
      // Fallback: 텍스트가 존재하면 바로 검색 시도
      return {
        needSearch: true,
        searchQuery: lastUserMessage,
        followUpMessage: '',
      };
    }
  }

  /**
   * DB에서 검색된 10권의 도서 목록과 대화 이력을 바탕으로
   * 자연스럽고 다정한 AI 추천 답변 메시지를 작성합니다.
   */
  async generateChatRecommendationMessage(
    messages: ChatMessageDto[],
    books: BookSearchResultDto[],
  ): Promise<string> {
    if (books.length === 0) {
      return '말씀해주신 내용과 딱 맞는 도서를 찾지 못했습니다. 원하시는 분위기나 주제를 조금 더 구체적으로 알려주시면 다시 찾아드릴게요.';
    }

    const conversationHistory = messages
      .slice(-4) // 최근 4개 발화만 전달
      .map((m) => `${m.role === ChatRole.USER ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');

    const bookSummaries = books
      .slice(0, 5)
      .map(
        (b, i) =>
          `${i + 1}. <${b.title}> (저자: ${b.author})\n   소개: ${b.description.slice(0, 120)}...`,
      )
      .join('\n\n');

    const prompt = `당신은 독서 플랫폼의 전문 도서 큐레이터입니다.
이전 대화 흐름을 고려하여, 아래 검색된 실제 책들을 추천하는 친근하고 정갈한 답변 메시지를 작성해주세요.

[최근 대화]
${conversationHistory}

[검색된 도서 목록]
${bookSummaries}

[지침]
1. 사용자의 요청(분위기, 상황, 조건 변경 등)을 반영하여 왜 이 책들을 추천하는지 2~3문장으로 다정하게 설명하세요.
2. 촌스러운 이모지나 캐릭터 페르소나(말투)는 절대 사용하지 말고, 단정하고 정갈한 톤앤매너를 유지하세요.
3. 책의 상세한 개별 정보는 하단 카드 UI로 노출되므로, 메시지 본문에서는 전체적인 추천 취지와 감성을 짚어주는 데 집중하세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.6,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      return (
        text.trim() ||
        '요청하신 마음에 꼭 들어맞는 책들을 엄선해 보았습니다. 천천히 살펴보세요.'
      );
    } catch (error) {
      console.error('Chat Recommendation Generation Error:', error);
      return '요청하신 분위기에 잘 어울리는 도서 목록을 준비했습니다. 하단 카드를 확인해 보세요.';
    }
  }
}
