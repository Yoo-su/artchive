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
   * 멀티턴 대화 및 도구 호출 여부 1차 판단 (Conversational Agent - 1차 동기 호출)
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

    const MAX_HISTORY_MESSAGES = 20;
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

      const args = call.args as { searchQuery?: string };
      const searchQueryRequested = args.searchQuery || lastMessage.content;

      return {
        message: '',
        books: [],
        searchQueryRequested,
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
   * 1차 대화 턴(의도 분석 및 일반 대화)을 실시간 토큰 스트리밍으로 처리하는 제너레이터
   */
  async *processConversationalTurnStream(
    messages: ChatMessageDto[],
  ): AsyncGenerator<{
    type: 'chunk' | 'function_call' | 'done';
    chunk?: string;
    searchQueryRequested?: string;
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

    const MAX_HISTORY_MESSAGES = 20;
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

      let foundFunctionCall: { searchQuery?: string } | null = null;
      let streamedAnyText = false;

      for await (const chunk of streamResult.stream) {
        const call = chunk.functionCalls()?.[0];
        if (call && call.name === 'search_books') {
          foundFunctionCall = (call.args as { searchQuery?: string }) || {};
          break;
        }

        try {
          const text = chunk.text();
          if (text) {
            streamedAnyText = true;
            yield { type: 'chunk', chunk: text };
          }
        } catch {
          // Function call 청크일 경우 text()는 비어있음
        }
      }

      if (foundFunctionCall) {
        yield {
          type: 'function_call',
          searchQueryRequested:
            foundFunctionCall.searchQuery || lastMessage.content,
        };
        return;
      }

      const response = await streamResult.response;
      if (!streamedAnyText) {
        const textResponse = response.text();
        if (textResponse) {
          yield { type: 'chunk', chunk: textResponse };
        }
      }

      yield { type: 'done', usageMetadata: response.usageMetadata };
    } catch (error) {
      this.logger.error('Conversational Turn Streaming Error:', error);
      yield {
        type: 'chunk',
        chunk:
          '대화를 처리하는 도중 일시적인 오류가 발생했습니다. 다시 한번 말씀해 주시겠어요?',
      };
      yield { type: 'done' };
    }
  }

  /**
   * pgvector 검색 결과 후보 도서들에 대해 동기 리랭킹 및 큐레이션 생성
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
        systemInstruction: getRAGSynthesisSystemInstruction(),
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

  /**
   * pgvector 검색 결과에 대해 실시간 토큰 단위로 스트리밍 큐레이션을 작성하는 제너레이터
   */
  async *filterAndSynthesizeRecommendationStream(
    messages: ChatMessageDto[],
    candidateBooks: BookSearchResultDto[],
  ): AsyncGenerator<{
    type: 'chunk' | 'done';
    chunk?: string;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    if (candidateBooks.length === 0) {
      yield {
        type: 'chunk',
        chunk:
          '말씀하신 조건과 어울리는 도서를 데이터베이스에서 찾지 못했습니다. 원하시는 장르나 키워드를 다르게 말씀해 주시면 다시 찾아드릴게요.',
      };
      yield { type: 'done' };
      return;
    }

    const prompt = buildRAGSynthesisPrompt(messages, candidateBooks);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getRAGSynthesisSystemInstruction(),
        generationConfig: {
          temperature: 0.35,
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
      this.logger.error('Streaming Synthesis Error:', error);
      yield {
        type: 'chunk',
        chunk:
          '\n\n요청하신 분위기와 주제에 잘 어울리는 도서 목록을 엄선했습니다. 상단의 도서 카드를 통해 자세한 정보를 확인해 보세요.',
      };
      yield { type: 'done' };
    }
  }

  /**
   * DB 검색 결과가 없거나 RPC 실패 시, 모델 자체 지식으로 실시간 큐레이션을 스트리밍 작성하는 제너레이터
   */
  async *generateParametricRecommendationStream(
    messages: ChatMessageDto[],
    searchQuery?: string,
  ): AsyncGenerator<{
    type: 'chunk' | 'done';
    chunk?: string;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    const prompt = buildParametricPrompt(messages, searchQuery);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getParametricSystemInstruction(),
        generationConfig: {
          temperature: 0.5,
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
  ): Promise<{
    message: string;
    books: BookSearchResultDto[];
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  }> {
    const prompt = buildParametricPrompt(messages, searchQuery);

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: getParametricSystemInstruction(),
        generationConfig: {
          temperature: 0.5,
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
