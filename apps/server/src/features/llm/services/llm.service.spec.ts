import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { BookService } from '@/features/book/services/book.service';

import { AiBookSummary } from '../entities/ai-book-summary.entity';
import { LlmTalkLog } from '../entities/llm-talk-log.entity';
import { LlmService } from './llm.service';

describe('LlmService', () => {
  let service: LlmService;
  let aiBookSummaryRepository: any;
  let bookService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
        {
          provide: getRepositoryToken(LlmTalkLog),
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AiBookSummary),
          useValue: {
            findOneBy: jest.fn(),
            create: jest.fn(
              (val: Record<string, any>): AiBookSummary => val as AiBookSummary,
            ),
            save: jest.fn(),
          },
        },
        {
          provide: BookService,
          useValue: {
            resolveBook: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
    aiBookSummaryRepository = module.get(getRepositoryToken(AiBookSummary));
    bookService = module.get(BookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSavedSummary', () => {
    it('should query repository by isbn', async () => {
      const mockSummary = { isbn: '1234567890', summary: 'test' };
      aiBookSummaryRepository.findOneBy.mockResolvedValue(mockSummary);

      const result = await service.getSavedSummary('1234567890');

      expect(aiBookSummaryRepository.findOneBy).toHaveBeenCalledWith({
        isbn: '1234567890',
      });
      expect(result).toEqual(mockSummary);
    });
  });

  describe('generateBookSummary', () => {
    it('should return cached summary if exists', async () => {
      const mockSaved = {
        isbn: '1234567890',
        summary: 'cached summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      };
      aiBookSummaryRepository.findOneBy.mockResolvedValue(mockSaved);

      const result = await service.generateBookSummary(
        'Title',
        'Author',
        'Desc',
        '1234567890',
      );

      expect(aiBookSummaryRepository.findOneBy).toHaveBeenCalledWith({
        isbn: '1234567890',
      });
      expect(result).toEqual({
        summary: 'cached summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      });
    });

    it('should generate via API and save to DB if not cached', async () => {
      aiBookSummaryRepository.findOneBy.mockResolvedValue(null);

      const mockModel = {
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () =>
              JSON.stringify({
                summary: 'generated summary',
                keyPoints: ['point 1'],
                targetAudience: 'audience',
                keywords: ['#tag'],
              }),
          },
        }),
      };
      (service as any).model = mockModel;

      const result = await service.generateBookSummary(
        'Title',
        'Author',
        'Desc',
        '1234567890',
      );

      expect(bookService.resolveBook).toHaveBeenCalledWith('1234567890');
      expect(aiBookSummaryRepository.create).toHaveBeenCalledWith({
        isbn: '1234567890',
        summary: 'generated summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      });
      expect(aiBookSummaryRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        summary: 'generated summary',
        keyPoints: ['point 1'],
        targetAudience: 'audience',
        keywords: ['tag'],
      });
    });
  });
});
