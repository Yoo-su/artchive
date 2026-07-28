import {
  FunctionDeclaration,
  GoogleGenerativeAI,
  SchemaType,
  Tool,
} from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MODEL_NAME } from '@/features/llm/constants/llm-model';
import {
  BookSearchResultDto,
  ChatMessageDto,
  ChatRole,
} from '@/features/search/dtos/ai-search.dto';

export interface ConversationalRagResult {
  message: string;
  books: BookSearchResultDto[];
  searchQueryRequested?: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

const CURATOR_PERSONA = `당신은 독서 플랫폼 '북적'의 지적이고 다정한 전문 도서 큐레이터 AI입니다.
사용자와의 대화 맥락을 완벽히 이해하며, 자연스러운 대화를 이끌어갑니다.
이모지나 캐릭터 가벼운 말투는 절대 사용하지 말고, 단정하고 정갈한 어조를 유지하세요.`;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.modelName =
      this.configService.get<string>('GEMINI_MODEL_NAME') ?? MODEL_NAME;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Gemini Function Calling (도서 DB 검색 도구 정의)
   */
  private getSearchBooksTool(): Tool {
    const searchBooksDeclaration: FunctionDeclaration = {
      name: 'search_books',
      description:
        '768차원 도서 DB(pgvector)에서 사용자의 취향, 장르, 기분, 독서 목적에 부합하는 실제 도서를 검색합니다.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          searchQuery: {
            type: SchemaType.STRING,
            description:
              '도서 DB 벡터 검색에 최적화된 명확한 한국어 쿼리 문장 (예: "우울할 때 마음을 달래주는 깊이 있는 감성 에세이")',
          },
        },
        required: ['searchQuery'],
      },
    };

    return { functionDeclarations: [searchBooksDeclaration] };
  }

  /**
   * ChatMessageDto 배열을 Gemini API 호환 history 포맷으로 안전하게 변환
   */
  private buildGeminiHistory(
    messages: ChatMessageDto[],
  ): { role: 'user' | 'model'; parts: { text: string }[] }[] {
    const past = messages.slice(0, -1);

    let startIdx = 0;
    while (startIdx < past.length && past[startIdx].role !== ChatRole.USER) {
      startIdx++;
    }

    const validPast = past.slice(startIdx);
    const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    for (const m of validPast) {
      const geminiRole = m.role === ChatRole.USER ? 'user' : 'model';
      if (
        history.length > 0 &&
        history[history.length - 1].role === geminiRole
      ) {
        history[history.length - 1].parts[0].text += `\n${m.content}`;
      } else {
        history.push({
          role: geminiRole,
          parts: [{ text: m.content }],
        });
      }
    }

    return history;
  }

  /**
   * 멀티턴 대화 및 도구 호출 여부 1차 판단 (Conversational Agent - 1차 LLM 호출)
   */
  async processConversationalTurn(
    messages: ChatMessageDto[],
  ): Promise<ConversationalRagResult> {
    if (!messages || messages.length === 0) {
      return {
        message: '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
        books: [],
      };
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== ChatRole.USER) {
      return {
        message: '원하시는 도서 분위기나 장르를 말씀해 주시면 찾아드릴게요.',
        books: [],
      };
    }

    // 토큰 비용 폭발 방지: 최근 20메시지(~10턴)만 히스토리로 전달
    const MAX_HISTORY_MESSAGES = 20;
    const trimmedMessages =
      messages.length > MAX_HISTORY_MESSAGES
        ? messages.slice(-MAX_HISTORY_MESSAGES)
        : messages;
    const history = this.buildGeminiHistory(trimmedMessages);

    const systemInstruction = `${CURATOR_PERSONA}

[핵심 행동 지침]
1. 자연스러운 대화와 공감:
   - 사용자가 인사, 한탄, 단순 감정 표현("에효", "심심하다", "졸려"), 또는 목적이 모호한 말을 했을 때는 절대로 서둘러 도서 DB를 검색하지 마세요.
   - 사용자의 말에 다정하게 응답하고, 어떤 기분이나 장르, 독서 분위기를 원하는지 자연스러운 꼬리 질문으로 대화를 이어가세요.

2. 도서 DB 검색 도구(search_books) 호출 조건:
   - 사용자가 구체적인 독서 목적, 기분, 장르, 분위기, 상충 조건("아까 그 책 말고 시집으로"), 또는 도서 추천 요청의 의도를 명확히 표현했을 때만 'search_books' 도구를 호출하세요.
   - 'search_books' 도구를 호출할 때는 도서 DB 벡터 검색에 최적화된 명확하고 풍부한 한국어 쿼리 문장(searchQuery)을 파라미터로 넘기세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction,
        tools: [this.getSearchBooksTool()],
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const call = result.response.functionCalls()?.[0];

      if (!call || call.name !== 'search_books') {
        const textResponse = result.response.text();
        return {
          message:
            textResponse.trim() ||
            '요청하신 독서 취향이나 찾으시는 분위기를 조금만 더 말씀해 주시겠어요?',
          books: [],
          usageMetadata: result.response.usageMetadata,
        };
      }

      const args = call.args as { searchQuery?: string };
      const searchQueryRequested = args.searchQuery || lastMessage.content;

      return {
        message: '',
        books: [],
        searchQueryRequested,
        usageMetadata: result.response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Conversational Turn Processing Error:', error);
      return {
        message:
          '대화를 처리하는 도중 일시적인 오류가 발생했습니다. 다시 한번 말씀해 주시겠어요?',
        books: [],
      };
    }
  }

  /**
   * pgvector 검색 결과 후보 도서들에 대해
   * (1) 사용자의 대화 맥락/독자층/장르에 부합하는 도서를 1:1 리랭킹하고,
   * (2) 최종 추천 총평 서두 메시지와 개별 도서별 RAG 사유(reason)를 단 1회의 LLM 호출로 고속 생성
   */
  async filterAndSynthesizeRecommendation(
    messages: ChatMessageDto[],
    candidateBooks: BookSearchResultDto[],
  ): Promise<{
    message: string;
    books: BookSearchResultDto[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    if (candidateBooks.length === 0) {
      return {
        message:
          '말씀하신 분위기나 상황에 부합하는 적합한 도서를 데이터베이스에서 발굴하지 못했습니다. 원하시는 장르나 키워드를 다르게 말씀해 주시면 다시 찾아드릴게요.',
        books: [],
      };
    }

    const conversationHistory = messages
      .slice(-4)
      .map((m) => `${m.role === ChatRole.USER ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');

    const bookSummaries = candidateBooks
      .map(
        (b) =>
          `- ISBN: ${b.isbn} | 제목: <${b.title}> | 저자: ${b.author} | 출판사: ${b.publisher} | 벡터 유사도: ${(b.similarity * 100).toFixed(0)}% | 줄거리: ${b.description.slice(0, 180)}`,
      )
      .join('\n');

    const systemInstruction = `${CURATOR_PERSONA}

당신은 지금 아래 사용자의 대화 맥락과 DB에서 검색된 후보 도서 목록을 검증하여,
조건에 진짜로 적합한 도서만 엄선하고 추천 메시지와 개별 추천 이유를 작성하는 역할입니다.`;

    const prompt = `[대화 기록]
${conversationHistory}

[후보 도서 목록 - 벡터 유사도가 낮을수록 사용자 의도와 무관할 가능성이 높음]
${bookSummaries}

[작성 및 검증 지침]
1. 검증 및 필터링: 사용자의 대상 독자층(성인 vs 아동), 장르(소설 vs 에세이 등), 독서 분위기/깊이와 맞지 않는 도서는 반드시 제외하세요. 벡터 유사도가 낮은 책일수록 더 엄격하게 검증하고, 실제로 맥락에 안 맞으면 과감히 제외하세요. 억지로 모든 후보에 이유를 붙이지 마세요.
2. message: 사용자의 요청과 기분에 공감하며 전체적인 추천 취지를 밝히는 정갈한 2~3문장 서두 문구. (부합 도서가 0권이면 부합하는 도서가 없다고 안내)
3. reasons: 검증을 통과한 각 도서의 ISBN별로 왜 이 책이 사용자의 대화 맥락에 적합한지 1~2문장의 구체적인 추천 이유 작성.

[응답 규격]
JSON 형식으로만 응답하세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              message: { type: SchemaType.STRING },
              reasons: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    isbn: { type: SchemaType.STRING },
                    reason: { type: SchemaType.STRING },
                  },
                  required: ['isbn', 'reason'],
                },
              },
            },
            required: ['message', 'reasons'],
          },
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as {
        message: string;
        reasons: { isbn: string; reason: string }[];
      };

      const reasonMap = new Map<string, string>();
      if (Array.isArray(parsed.reasons)) {
        parsed.reasons.forEach((r) => {
          if (r.isbn && r.reason) reasonMap.set(r.isbn, r.reason);
        });
      }

      const validBooks = candidateBooks
        .filter((b) => reasonMap.has(b.isbn))
        .map((b) => ({
          ...b,
          reason: reasonMap.get(b.isbn)!,
        }))
        .slice(0, 6);

      if (validBooks.length === 0) {
        return {
          message:
            parsed.message ||
            '말씀하신 조건에 진정으로 부합하는 적합한 도서를 데이터베이스에서 발굴하지 못했습니다. 다른 장르나 키워드로 말씀해 주시면 다시 찾아드릴게요.',
          books: [],
          usageMetadata: result.response.usageMetadata,
        };
      }

      return {
        message:
          parsed.message ||
          '요청하신 질문 맥락에 맞춰 엄선한 추천 도서들입니다.',
        books: validBooks,
        usageMetadata: result.response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Unified Synthesis Error:', error);
      return {
        message:
          '요청하신 분위기와 주제에 잘 어울리는 도서 목록입니다. 각 책의 추천 사유를 확인해 보세요.',
        books: candidateBooks.slice(0, 5).map((b) => ({
          ...b,
          reason: `${b.author} 저자의 대표작으로, 요청하신 독서 감성과 긴밀히 연결됩니다.`,
        })),
      };
    }
  }
}
