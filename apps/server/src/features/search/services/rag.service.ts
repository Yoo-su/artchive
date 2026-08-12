import {
  FunctionDeclaration,
  GoogleGenerativeAI,
  Schema,
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

import {
  buildParametricPrompt,
  buildRAGSynthesisPrompt,
  getConversationalSystemInstruction,
  getParametricSystemInstruction,
  getRAGSynthesisSystemInstruction,
} from '../prompts/curator-prompts';

export interface ConversationalRagResult {
  message: string;
  books: BookSearchResultDto[];
  searchQueryRequested?: string;
  targetCount?: number;
  preferredPublishers?: string[];
  excludedKeywords?: string[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

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
        '도서 DB(pgvector)에서 사용자의 취향, 장르, 기분, 특정 작가/출판사/권수 조건에 부합하는 도서를 검색합니다.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          searchQuery: {
            type: SchemaType.STRING,
            description:
              '도서 DB 벡터 검색에 최적화된 명확한 한국어 쿼리 문장 (예: "도스토옙스키 대표 소설")',
          },
          targetCount: {
            type: SchemaType.INTEGER,
            description:
              '사용자가 명시적으로 요청한 추천 도서 권수 (예: 5. 명시가 없으면 5)',
          },
          preferredPublishers: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description:
              '사용자가 요구한 출판사 목록 (예: ["민음사", "문학동네", "열린책들"]. 지정 없으면 빈 배열 [])',
          },
          excludedKeywords: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description:
              '사용자가 명시적으로 제외해달라고 한 작가, 키워드, 장르 목록 (예: ["히가시노 게이고", "살인", "SF"]. 지정 없으면 빈 배열 [])',
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
      const cleanText = m.content?.trim();
      if (!cleanText) continue;

      if (
        history.length > 0 &&
        history[history.length - 1].role === geminiRole
      ) {
        history[history.length - 1].parts[0].text += `\n${cleanText}`;
      } else {
        history.push({
          role: geminiRole,
          parts: [{ text: cleanText }],
        });
      }
    }

    while (history.length > 0 && history[history.length - 1].role !== 'model') {
      history.pop();
    }

    return history;
  }

  /**
   * 1차 턴 실시간 스트리밍 의도 분류 제너레이터
   * - 일반 대화: 실시간 토큰(chunk) 즉시 yield (TTFB ~200ms)
   * - 도서 검색: function_call 감지 즉시 텍스트 스트리밍 중단 후 도구 인자 yield
   */
  async *processConversationalTurnStream(
    messages: ChatMessageDto[],
  ): AsyncGenerator<{
    type: 'chunk' | 'function_call' | 'done';
    chunk?: string;
    searchQueryRequested?: string;
    targetCount?: number;
    preferredPublishers?: string[];
    excludedKeywords?: string[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    if (!messages || messages.length === 0) {
      yield {
        type: 'chunk',
        chunk: '안녕하세요! 어떤 책을 찾고 계신가요? 편안하게 말씀해 주세요.',
      };
      yield { type: 'done' };
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== ChatRole.USER) {
      yield {
        type: 'chunk',
        chunk: '원하시는 도서 분위기나 장르를 말씀해 주시면 찾아드릴게요.',
      };
      yield { type: 'done' };
      return;
    }

    const MAX_HISTORY_MESSAGES = 16;
    const trimmedMessages =
      messages.length > MAX_HISTORY_MESSAGES
        ? messages.slice(-MAX_HISTORY_MESSAGES)
        : messages;
    const history = this.buildGeminiHistory(trimmedMessages);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getConversationalSystemInstruction(),
        tools: [this.getSearchBooksTool()],
      });

      const chat = model.startChat({ history });
      const streamResult = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of streamResult.stream) {
        const call = chunk.functionCalls()?.[0];
        if (call && call.name === 'search_books') {
          const args = call.args as {
            searchQuery?: string;
            targetCount?: number;
            preferredPublishers?: string[];
            excludedKeywords?: string[];
          };
          yield {
            type: 'function_call',
            searchQueryRequested: args.searchQuery || lastMessage.content,
            targetCount:
              typeof args.targetCount === 'number' && args.targetCount > 0
                ? Math.max(1, Math.min(args.targetCount, 10))
                : 5,
            preferredPublishers: Array.isArray(args.preferredPublishers)
              ? args.preferredPublishers.filter(Boolean)
              : [],
            excludedKeywords: Array.isArray(args.excludedKeywords)
              ? args.excludedKeywords.filter(Boolean)
              : [],
          };
          return;
        }

        try {
          const text = chunk.text();
          if (text) {
            yield { type: 'chunk', chunk: text };
          }
        } catch {
          // Function calling 응답 청크는 text가 없을 수 있음
        }
      }

      const response = await streamResult.response;
      yield { type: 'done', usageMetadata: response.usageMetadata };
    } catch (error) {
      this.logger.error('Conversational Turn Streaming Error:', error);
      yield {
        type: 'chunk',
        chunk:
          '대화를 처리하는 도중 일시적인 오류가 발생했습니다. 잠시 후 다시 말씀해 주시겠어요?',
      };
      yield { type: 'done' };
    }
  }

  /**
   * 동기 1차 턴 판단 메서드
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

    const MAX_HISTORY_MESSAGES = 16;
    const trimmedMessages =
      messages.length > MAX_HISTORY_MESSAGES
        ? messages.slice(-MAX_HISTORY_MESSAGES)
        : messages;
    const history = this.buildGeminiHistory(trimmedMessages);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getConversationalSystemInstruction(),
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

      const args = call.args as {
        searchQuery?: string;
        targetCount?: number;
        preferredPublishers?: string[];
        excludedKeywords?: string[];
      };
      const searchQueryRequested = args.searchQuery || lastMessage.content;
      const targetCount =
        typeof args.targetCount === 'number' && args.targetCount > 0
          ? Math.max(1, Math.min(args.targetCount, 10))
          : 5;
      const preferredPublishers = Array.isArray(args.preferredPublishers)
        ? args.preferredPublishers.filter(Boolean)
        : [];
      const excludedKeywords = Array.isArray(args.excludedKeywords)
        ? args.excludedKeywords.filter(Boolean)
        : [];

      return {
        message: '',
        books: [],
        searchQueryRequested,
        targetCount,
        preferredPublishers,
        excludedKeywords,
        usageMetadata: result.response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Conversational Turn Error:', error);
      return {
        message:
          '대화를 처리하는 도중 일시적인 오류가 발생했습니다. 잠시 후 다시 말씀해 주시겠어요?',
        books: [],
      };
    }
  }

  /**
   * 2차 RAG: DB 검색된 도서들에 대해 맞춤 추천 사유(reason) 및 총평(message)을 구조화하여 생성
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
          '말씀하신 조건과 어울리는 도서를 데이터베이스에서 찾지 못했습니다. 원하시는 장르나 키워드를 다르게 말씀해 주시면 다시 찾아드릴게요.',
        books: [],
      };
    }

    const prompt = buildRAGSynthesisPrompt(messages, candidateBooks);

    const schema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        message: {
          type: SchemaType.STRING,
          description:
            '사용자에게 건네는 따뜻하고 정갈한 도서 추천 총평 및 인사말 (1~2문장)',
        },
        recommendations: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              isbn: { type: SchemaType.STRING },
              reason: {
                type: SchemaType.STRING,
                description:
                  '사용자의 요청 맥락과 연결하여 이 책을 추천하는 구체적이고 설득력 있는 추천 까닭 (1~2문장)',
              },
            },
            required: ['isbn', 'reason'],
          },
        },
      },
      required: ['message', 'recommendations'],
    };

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getRAGSynthesisSystemInstruction(),
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());

      const reasonMap = new Map<string, string>();
      if (Array.isArray(parsed.recommendations)) {
        for (const item of parsed.recommendations) {
          if (item.isbn && item.reason) {
            reasonMap.set(item.isbn, item.reason);
          }
        }
      }

      const validBooks = candidateBooks.map((b) => ({
        ...b,
        reason: reasonMap.get(b.isbn) || b.description.slice(0, 100),
      }));

      return {
        message:
          parsed.message ||
          '요청하신 독서 취향과 맥락에 맞춰 엄선한 추천 도서들입니다. 각 도서의 추천 까닭을 확인해 보세요.',
        books: validBooks,
        usageMetadata: result.response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Unified Synthesis Error:', error);
      return {
        message:
          '요청하신 독서 취향과 맥락에 맞춰 엄선한 추천 도서들입니다. 상단 도서 카드를 통해 자세한 정보를 확인해 보세요.',
        books: candidateBooks,
      };
    }
  }

  /**
   * DB 검색 결과가 없거나 특정 조건의 도서가 없을 때, 모델 자체 지식으로 실시간 큐레이션을 스트리밍 작성하는 제너레이터
   */
  async *generateParametricRecommendationStream(
    messages: ChatMessageDto[],
    searchQuery?: string,
    targetCount = 5,
  ): AsyncGenerator<{
    type: 'chunk' | 'done';
    chunk?: string;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    const prompt = buildParametricPrompt(messages, searchQuery, targetCount);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getParametricSystemInstruction(),
        generationConfig: {
          temperature: 0.4,
        },
      });

      const result = await model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield { type: 'chunk', chunk: text };
        }
      }
      const response = await result.response;
      yield { type: 'done', usageMetadata: response.usageMetadata };
    } catch (error) {
      this.logger.error('Parametric Recommendation Streaming Error:', error);
      yield {
        type: 'chunk',
        chunk:
          '말씀하신 상황과 어울리는 도서를 추천해 드리고자 했으나 일시적인 오류가 발생했습니다. 잠시 후 다시 말씀해 주시겠어요?',
      };
      yield { type: 'done' };
    }
  }

  /**
   * DB 검색 결과가 없을 때 모델 자체 지식으로 도서 추천 텍스트를 단일 생성
   */
  async generateParametricRecommendation(
    messages: ChatMessageDto[],
    searchQuery?: string,
    targetCount = 5,
  ): Promise<{
    message: string;
    books: BookSearchResultDto[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    const prompt = buildParametricPrompt(messages, searchQuery, targetCount);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getParametricSystemInstruction(),
        generationConfig: {
          temperature: 0.4,
        },
      });

      const result = await model.generateContent(prompt);
      return {
        message:
          result.response.text() ||
          '요청하신 조건에 어울리는 추천 도서를 준비하지 못했습니다.',
        books: [],
        usageMetadata: result.response.usageMetadata,
      };
    } catch (error) {
      this.logger.error('Parametric Recommendation Error:', error);
      return {
        message:
          '도서 추천을 생성하는 도중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        books: [],
      };
    }
  }
}
