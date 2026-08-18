import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { BookService } from '@/features/book/services/book.service';
import { ReviewService } from '@/features/review/services/review.service';

import { Comment, CommentTargetType } from '../entities/comment.entity';
import { CommentLike } from '../entities/comment-like.entity';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: jest.Mocked<Partial<Repository<Comment>>>;
  let commentLikeRepository: jest.Mocked<Partial<Repository<CommentLike>>>;
  let reviewService: jest.Mocked<Partial<ReviewService>>;
  let bookService: jest.Mocked<Partial<BookService>>;
  let eventEmitter: jest.Mocked<Partial<EventEmitter2>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  beforeEach(async () => {
    commentRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      decrement: jest.fn(),
      increment: jest.fn(),
    };

    commentLikeRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    reviewService = {
      findReviewById: jest.fn(),
      findReviewsByIds: jest.fn().mockResolvedValue([]),
    };

    bookService = {
      findBookByIsbn: jest.fn(),
      findBooksByIsbns: jest.fn().mockResolvedValue([]),
    };

    eventEmitter = {
      emit: jest.fn(),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          (cb: (manager: Record<string, unknown>) => Promise<unknown>) => {
            const mockQb = {
              insert: jest.fn().mockReturnThis(),
              into: jest.fn().mockReturnThis(),
              values: jest.fn().mockReturnThis(),
              orIgnore: jest.fn().mockReturnThis(),
              execute: jest
                .fn()
                .mockResolvedValue({ identifiers: [{ id: 1 }] }),
            };
            const mockManager = {
              findOne: jest.fn(),
              create: jest
                .fn()
                .mockImplementation(
                  (_entity: unknown, data: Record<string, unknown>) => data,
                ),
              save: jest.fn().mockResolvedValue({}),
              delete: jest.fn().mockResolvedValue({}),
              increment: jest.fn().mockResolvedValue({}),
              decrement: jest.fn().mockResolvedValue({}),
              createQueryBuilder: jest.fn().mockReturnValue(mockQb),
            };
            return cb(mockManager);
          },
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
        {
          provide: getRepositoryToken(CommentLike),
          useValue: commentLikeRepository,
        },
        {
          provide: ReviewService,
          useValue: reviewService,
        },
        {
          provide: BookService,
          useValue: bookService,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  describe('getMyComments', () => {
    it('should batch query reviews and books to avoid N+1 queries', async () => {
      const mockComments = [
        {
          id: 1,
          content: '첫 번째 댓글',
          targetType: CommentTargetType.REVIEW,
          targetId: '10',
          likeCount: 0,
          createdAt: new Date('2026-08-01'),
        },
        {
          id: 2,
          content: '두 번째 댓글',
          targetType: CommentTargetType.BOOK,
          targetId: '9788937460000',
          likeCount: 2,
          createdAt: new Date('2026-08-02'),
        },
      ] as Comment[];

      const mockQb = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockComments, 2]),
      };

      (commentRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQb,
      );

      (reviewService.findReviewsByIds as jest.Mock).mockResolvedValue([
        {
          id: 10,
          title: '죄와 벌 서평',
          book: { title: '죄와 벌' },
        },
      ]);

      (bookService.findBooksByIsbns as jest.Mock).mockResolvedValue([
        {
          isbn: '9788937460000',
          title: '어린 왕자',
        },
      ]);

      const result = await service.getMyComments(1, 1, 10);

      expect(reviewService.findReviewsByIds).toHaveBeenCalledWith([10]);
      expect(bookService.findBooksByIsbns).toHaveBeenCalledWith([
        '9788937460000',
      ]);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].targetTitle).toBe('죄와 벌 서평');
      expect(result.data[0].targetSubtitle).toBe('죄와 벌');
      expect(result.data[1].targetTitle).toBe('어린 왕자');
    });
  });

  describe('toggleLike', () => {
    it('좋아요가 없을 때 orIgnore()를 통해 새로 좋아요를 추가하고 likeCount를 증가시켜야 합니다', async () => {
      const comment = { id: 1, userId: 2, likeCount: 0 } as Comment;
      (commentRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(comment) // findCommentOrThrow
        .mockResolvedValueOnce({ ...comment, likeCount: 1 }); // updatedComment

      const result = await service.toggleLike(1, 1);
      expect(result.isLiked).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.liked',
        expect.objectContaining({ isLiked: true }),
      );
    });

    it('이미 좋아요가 있을 때 좋아요를 삭제하고 likeCount를 감소시켜야 합니다', async () => {
      const comment = { id: 1, userId: 2, likeCount: 1 } as Comment;
      const existingLike = { id: 99, commentId: 1, userId: 1 };

      (commentRepository.findOne as jest.Mock)
        .mockResolvedValueOnce(comment) // findCommentOrThrow
        .mockResolvedValueOnce({ ...comment, likeCount: 0 }); // updatedComment

      (dataSource.transaction as jest.Mock).mockImplementation(
        async (cb: (manager: Record<string, unknown>) => Promise<unknown>) => {
          const mockManager = {
            findOne: jest.fn().mockResolvedValue(existingLike),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            decrement: jest.fn().mockResolvedValue({}),
          };
          return await cb(mockManager);
        },
      );

      const result = await service.toggleLike(1, 1);
      expect(result.isLiked).toBe(false);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'comment.liked',
        expect.objectContaining({ isLiked: false }),
      );
    });
  });
});
