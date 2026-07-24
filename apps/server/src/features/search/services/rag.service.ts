import {
  FunctionDeclaration,
  GoogleGenerativeAI,
  SchemaType,
  Tool,
} from '@google/generative-ai';
import { Injectable } from '@nestjs/common';
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
}

@Injectable()
export class RagService {
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
   * 멀티턴 대화 및 도구 호출 여부 1차 판단 (Natural Conversational Agent)
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

    // 이전 대화 히스토리를 Gemini 대화 포맷으로 변환
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === ChatRole.USER ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const systemInstruction = `당신은 독서 플랫폼 '북적'의 지적이고 다정한 전문 도서 큐레이터 AI입니다.
사용자와의 대화 맥락을 완벽히 이해하며, 자연스러운 대화를 이끌어갑니다.

[핵심 행동 지침]
1. 자연스러운 대화와 공감:
   - 사용자가 인사, 한탄, 단순 감정 표현("에효", "심심하다", "졸려"), 또는 목적이 모호한 말을 했을 때는 절대로 서둘러 도서 DB를 검색하지 마세요.
   - 사용자의 말에 다정하게 응답하고, 어떤 기분이나 장르, 독서 분위기를 원하는지 자연스러운 꼬리 질문으로 대화를 이어가세요.

2. 도서 DB 검색 도구(search_books) 호출 조건:
   - 사용자가 구체적인 독서 목적, 기분, 장르, 분위기, 상충 조건("아까 그 책 말고 시집으로"), 또는 도서 추천 요청의 의도를 명확히 표현했을 때만 'search_books' 도구를 호출하세요.
   - 'search_books' 도구를 호출할 때는 도서 DB 벡터 검색에 최적화된 명확하고 풍부한 한국어 쿼리 문장(searchQuery)을 파라미터로 넘기세요.

3. 톤앤매너:
   - 이모지나 캐릭터 가벼운 말투는 절대 사용하지 말고, 단정하고 정갈한 어조를 유지하세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction,
        tools: [this.getSearchBooksTool()],
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const call = result.response.functionCalls()?.[0];

      // 1. AI가 대화만으로 응답하기로 판단한 경우 (search_books 호출 안 함)
      if (!call || call.name !== 'search_books') {
        const textResponse = result.response.text();
        return {
          message:
            textResponse.trim() ||
            '어떤 분위기나 장르의 책을 찾으시는지 조금만 더 구체적으로 말씀해 주시겠어요?',
          books: [],
        };
      }

      // 2. AI가 도서 DB 검색 도구를 호출하기로 결정한 경우
      const args = call.args as { searchQuery?: string };
      const searchQueryRequested = args.searchQuery || lastMessage.content;

      return {
        message: '',
        books: [],
        searchQueryRequested,
      };
    } catch (error) {
      console.error('Conversational Turn Processing Error:', error);
      return {
        message:
          '어떤 분위기나 장르의 책을 찾으시는지 조금만 더 이야기해 주시겠어요?',
        books: [],
      };
    }
  }

  /**
   * pgvector 후보 도서들에 대해 사용자의 요구사항(독자층, 장르, 깊이)과 1:1 교차 검증 및 Reranking 수행
   */
  async filterAndRerankBooks(
    messages: ChatMessageDto[],
    candidateBooks: BookSearchResultDto[],
  ): Promise<BookSearchResultDto[]> {
    if (candidateBooks.length === 0) return [];

    const conversationHistory = messages
      .slice(-4)
      .map((m) => `${m.role === ChatRole.USER ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');

    const booksSummary = candidateBooks
      .map(
        (b) =>
          `- ISBN: ${b.isbn} | 제목: <${b.title}> | 저자: ${b.author} | 출판사: ${b.publisher} | 줄거리: ${b.description.slice(0, 200)}`,
      )
      .join('\n');

    const prompt = `당신은 도서 검색 결과의 연관성과 품질을 검증하는 전문 AI 리랭커(Reranker)입니다.
사용자의 대화 맥락/요구사항과 DB에서 검색된 도서 후보 목록을 비교하여, 사용자의 의도와 맞지 않는 부적절한 도서를 엄격히 제외(Filter Out)하세요.

[사용자 대화 맥락]
${conversationHistory}

[후보 도서 목록]
${booksSummary}

[검증 원칙]
1. 사용자가 요구한 타겟 독자층(성인 vs 아동), 장르(소설 vs 에세이 등), 독서 분위기, 주제적 깊이와 부합하는 도서만 선별하세요.
2. 사용자의 요구사항과 명백히 모순되거나 타겟층/장르가 불일치하는 도서는 모두 제외하세요.
3. 부합하는 도서가 없다면 validIsbns를 빈 배열([])로 반환하세요.

[응답 규격]
JSON 형식으로만 응답하세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              validIsbns: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ['validIsbns'],
          },
          temperature: 0.1,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text) as { validIsbns: string[] };

      const validIsbnSet = new Set(parsed.validIsbns || []);
      return candidateBooks.filter((b) => validIsbnSet.has(b.isbn));
    } catch (error) {
      console.error('Reranking Error:', error);
      return candidateBooks.slice(0, 5);
    }
  }

  /**
   * 검증된 도서 목록에 대한 최종 RAG 큐레이션 서두 메시지 및 개별 추천 사유(reason) 합성
   */
  async synthesizeFinalRecommendation(
    messages: ChatMessageDto[],
    books: BookSearchResultDto[],
  ): Promise<{ message: string; books: BookSearchResultDto[] }> {
    if (books.length === 0) {
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

    const candidateBooks = books.slice(0, 6);
    const bookSummaries = candidateBooks
      .map(
        (b) =>
          `- ISBN: ${b.isbn} | 제목: <${b.title}> | 저자: ${b.author} | 줄거리: ${b.description.slice(0, 150)}...`,
      )
      .join('\n');

    const prompt = `당신은 전문 도서 큐레이터입니다.
사용자의 대화 맥락과 검증을 통과한 도서 목록을 비교분석(RAG)하여, 전체 추천 취지 메시지(message)와 각 도서별 개별 추천 이유(reason)를 작성하세요.

[대화 기록]
${conversationHistory}

[검증된 도서 목록]
${bookSummaries}

[작성 지침]
1. message: 사용자의 요청과 기분에 공감하며 전체적인 추천 취지를 밝히는 정갈한 2~3문장 서두 문구.
2. reasons: 각 도서의 ISBN별로 왜 이 책이 사용자의 대화 맥락과 요청에 적합한지 1~2문장의 개별 추천 이유(reason) 작성.
3. 이모지나 가벼운 톤은 사용하지 말고, 단정하고 정갈한 어조를 유지하세요.

[응답 규격]
JSON 형식으로만 응답하세요.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
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
          temperature: 0.4,
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

      const enrichedBooks = candidateBooks.map((b) => ({
        ...b,
        reason:
          reasonMap.get(b.isbn) ||
          `${b.title} 은(는) 요청하신 독서 감성과 서사를 잘 반영하고 있는 추천 도서입니다.`,
      }));

      return {
        message:
          parsed.message ||
          '요청하신 질문 맥락에 맞춰 엄선한 추천 도서들입니다.',
        books: enrichedBooks,
      };
    } catch (error) {
      console.error('Final Recommendation Synthesis Error:', error);
      return {
        message:
          '요청하신 분위기와 주제에 잘 어울리는 도서 목록입니다. 각 책의 추천 사유를 확인해 보세요.',
        books: candidateBooks.map((b) => ({
          ...b,
          reason: `${b.author} 저자의 대표작으로, 요청하신 독서 감성과 긴밀히 연결됩니다.`,
        })),
      };
    }
  }
}
