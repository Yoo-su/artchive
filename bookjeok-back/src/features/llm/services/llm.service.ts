import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MODEL_NAME } from '../constants/llm-model';
import { BookSummaryResponseDto } from '../dtos/book-summary-response.dto';
import { getPromptText } from '../utils/get-prompt-text';
import { NEOGULIP_SYSTEM_PROMPT } from '../constants/neogulip-prompt';
import { NaverBookSearchService } from '@/features/book/services/naver-book-search.service';
import { TalkRequestDto } from '../dtos/talk-request.dto';
import { TalkResponseDto } from '../dtos/talk-response.dto';
import { LlmTalkLog } from '../entities/llm-talk-log.entity';

@Injectable()
export class LlmService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  /**
   * ConfigService를 주입받아 API 키를 안전하게 사용합니다.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly naverBookSearchService: NaverBookSearchService,
    @InjectRepository(LlmTalkLog)
    private readonly logRepository: Repository<LlmTalkLog>,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: MODEL_NAME,
    });
  }

  // ... (generateBookSummary omitted for brevity, assuming tool won't touch it if I target correctly)
  // Actually, I can't skip lines easily with `replace_file_content` if I want to update constructor AND processTalk in one go efficiently without viewing again.
  // Wait, I already viewed the file in step 1309.
  // I will use `multi_replace_file_content`.

  // Correction: `replace_file_content` is safer for the constructor. I'll split the work.
  // First, imports and constructor.
  // Then `processTalk`.

  // Wait, I am restricted to one `replace_file_content` per turn? No, I can do tools sequentially?
  // "Do NOT make multiple parallel calls to this tool or ... for the same file."
  // I should use `multi_replace_file_content` for this file since I need to edit imports (top) and `processTalk` (middle).

  // Wait, `viewer` showed imports at top.
  // I'll construct a multi-replace.

  /**
   * 책 제목과 저자를 기반으로 AI 요약 및 후기를 생성합니다.
   * @param title - 책 제목
   * @param author - 저자
   * @returns 생성된 요약 텍스트
   */
  async generateBookSummary(
    title: string,
    author: string,
    description?: string,
  ): Promise<BookSummaryResponseDto> {
    try {
      const prompt = getPromptText(title, author, description);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // JSON 파싱 시도
      try {
        // 마크다운 코드 블록 제거 (```json ... ```)
        const cleanedText = text.replace(/```json\n|\n```/g, '').trim();
        return JSON.parse(cleanedText) as BookSummaryResponseDto;
      } catch (e) {
        console.warn('JSON 파싱 실패, 원본 텍스트 반환', e);
        return { summary: text };
      }
    } catch (error) {
      console.error('Gemini API 호출에 실패했습니다:', error);
      throw new InternalServerErrorException(
        '죄송해요, 책 내용을 읽어오다가 나뭇잎을 놓쳤어요구리! 🍃',
      );
    }
  }
  /**
   * 유저의 입력에 대해 적응형 대화(Adaptive Flow)를 수행하고, 추천이 필요하면 책 검색까지 수행합니다.
   */
  async processTalk(dto: TalkRequestDto): Promise<TalkResponseDto> {
    const { message, history } = dto;

    try {
      // 1. LLM에게 유저의 의도와 적절한 반응을 물어본다.
      const llmResult = await this.generateRecommendationTalk(message, history);

      // 2. 만약 LLM이 '질문'이 필요하다고 판단하면 그대로 반환
      if (llmResult.type === 'QUESTION') {
        return {
          message: llmResult.message,
          isFinal: false,
        };
      }

      // 3. 만약 '추천'이 가능하다고 판단하면 제안된 제목들로 각각 책 검색 수행
      let recommendedBooks: any[] | undefined = undefined;
      const startTime = Date.now();

      if (llmResult.type === 'RECOMMENDATION' && llmResult.recommendedTitles) {
        // 병렬로 네이버 API 호출하여 각 제목에 대한 최상위 검색 결과를 가져온다.
        const searchPromises = llmResult.recommendedTitles.map(
          async (title) => {
            const results = await this.naverBookSearchService.search(title, 1);
            return results[0]; // 가장 정확한 첫 번째 결과만 사용
          },
        );

        const rawResults = await Promise.all(searchPromises);

        // 검색 결과가 있는(undefined가 아닌) 책들만 필터링
        const verifiedBooks = rawResults.filter(
          (book): book is any => book !== undefined,
        );
        recommendedBooks = verifiedBooks;
      }

      const latency = Date.now() - startTime;

      // 로그 비동기 저장 (에러가 나도 메인 로직은 성공해야 함)
      this.logRepository
        .save({
          userMessage: message,
          aiMessage: llmResult.message,
          analysis: llmResult.analysis,
          recommendedTitles: llmResult.recommendedTitles,
          model: MODEL_NAME,
          latency,
          userId: 'anonymous',
        })
        .catch((e) => console.error('Log Save Error:', e));

      if (recommendedBooks && recommendedBooks.length > 0) {
        return {
          message: llmResult.message,
          isFinal: true,
          recommendedBooks,
        };
      }

      // 검색 결과가 하나도 없는 경우 (LLM은 추천했으나 API에서 못 찾음)
      if (llmResult.type === 'RECOMMENDATION') {
        return {
          message:
            '추천해드리고 싶은 책 제목을 찾았는데, 도서관(검색 엔진)에서 실물 책을 찾을 수가 없네요구리... 🍃\n다른 키워드로 다시 말씀해 주시겠어요?',
          isFinal: false,
        };
      }

      // 예외 상황: 추천 타입인데 키워드가 없는 경우 등
      return {
        message:
          '죄송해요, 딱 맞는 책을 찾지 못했어요구리. 다른 힌트를 주시겠어요? 🍃',
        isFinal: false,
      };
    } catch (error) {
      console.error('LlmService ProcessTalk Error:', error);
      throw new InternalServerErrorException(
        '너굴잎이 대화 내용을 놓쳤어요. 다시 말씀해 주시겠어요? 🍃',
      );
    }
  }

  /**
   * 유저의 입력에 대해 적응형 대화(Adaptive Flow)를 수행합니다.
   * - 모호한 입력 -> 질문(QUESTION) 생성
   * - 구체적 입력 -> 키워드 추출 및 추천(RECOMMENDATION)
   */
  async generateRecommendationTalk(
    message: string,
    history?: string,
  ): Promise<{
    type: 'QUESTION' | 'RECOMMENDATION';
    message: string;
    recommendedTitles?: string[];
    analysis?: string;
  }> {
    try {
      const historyText = history ? `History:\n${history}\n` : '';
      const prompt = NEOGULIP_SYSTEM_PROMPT.replace(
        '${message}',
        message,
      ).replace('${historyText}', historyText);

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      // Clean up markdown code blocks if present
      const cleanText = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanText) as {
        type: 'QUESTION' | 'RECOMMENDATION';
        message: string;
        recommendedTitles?: string[];
        analysis?: string;
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new InternalServerErrorException(
        '너굴잎이 숲속에서 길을 잃었어요. 잠시 후 다시 불러주세요! 🍃',
      );
    }
  }
}
