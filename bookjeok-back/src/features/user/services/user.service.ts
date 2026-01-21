import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { SocialLoginDto } from '@/features/auth/dtos/social-login.dto';
import {
  UsedBookSale,
  SaleStatus,
} from '@/features/used-book-sale/entities/used-book-sale.entity';
import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { Book } from '@/features/book/entities/book.entity';
import { BookInfoDto } from '@/features/book/dtos/book-info.dto';
import { Review } from '@/features/review/entities/review.entity';
import { ReviewReaction } from '@/features/review/entities/review-reaction.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Comment } from '@/features/comment/entities/comment.entity';
import { CommentLike } from '@/features/comment/entities/comment-like.entity';
import { ReadReceipt } from '@/features/chat/entities/read-receipt.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UsedBookSale)
    private readonly usedBookSaleRepository: Repository<UsedBookSale>,
    @InjectRepository(ChatParticipant)
    private readonly chatParticipantRepository: Repository<ChatParticipant>,
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // 개발 환경 편의성을 위해 서버 시작 시 유저 ID 시퀀스를 동기화합니다.
    if (process.env.NODE_ENV !== 'production') {
      try {
        await this.dataSource.query(
          `SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) + 1 FROM users), 1), false)`,
        );
        console.log('User ID sequence synchronized.');
      } catch (e) {
        console.warn('Failed to sync user sequence:', e);
      }
    }
  }

  /**
   * 소셜 제공자 ID로 유저를 조회합니다.
   * @param provider 제공자 (naver, kakao 등)
   * @param providerId 제공자 측 유저 ID
   * @returns 유저 엔티티 또는 null
   */
  async findByProviderId(
    provider: string,
    providerId: string,
  ): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { provider, providerId },
    });
  }

  /**
   * 새로운 유저를 생성합니다.
   * @param socialLoginDto 소셜 로그인 정보
   * @returns 생성된 유저
   */
  async createUser(socialLoginDto: SocialLoginDto): Promise<User> {
    const handle = `user_${Math.random().toString(36).substring(2, 10)}`;
    const newUser = this.userRepository.create({ ...socialLoginDto, handle });
    return await this.userRepository.save(newUser);
  }

  /**
   * 이메일 기반 유저를 생성합니다.
   * @param email 이메일
   * @param password 암호화된 비밀번호
   * @param nickname 닉네임
   * @returns 생성된 유저
   */
  async createEmailUser(
    email: string,
    password: string,
    nickname: string,
  ): Promise<User> {
    let handle = `user_${Math.random().toString(36).substring(2, 10)}`;
    let isUnique = false;
    let retryCount = 0;

    // 핸들 중복 검사 및 재생성 (최대 3회)
    while (!isUnique && retryCount < 3) {
      const existing = await this.userRepository.findOne({ where: { handle } });
      if (!existing) {
        isUnique = true;
      } else {
        handle = `user_${Math.random().toString(36).substring(2, 10)}`;
        retryCount++;
      }
    }

    if (!isUnique) {
      // 3회 실패 시 타임스탬프 추가
      handle = `${handle}_${Date.now().toString().slice(-4)}`;
    }

    const newUser = this.userRepository.create({
      provider: 'local',
      providerId: email,
      email,
      password,
      nickname,
      handle,
      profileImageUrl: `default_profile${Math.floor(Math.random() * 10) + 1}`,
    });
    return await this.userRepository.save(newUser);
  }

  /**
   * 이메일로 유저를 조회합니다.
   * @param email 이메일
   * @returns 유저 엔티티 또는 null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  /**
   * 핸들로 유저를 조회합니다.
   * @param handle 유저 핸들
   * @returns 유저 엔티티 또는 null
   */
  async findByHandle(handle: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { handle } });
  }

  /**
   * 유저 정보를 업데이트합니다.
   * 닉네임 변경 시 중복 검사를 수행합니다.
   * @param userId 유저 ID
   * @param updateUserDto 업데이트할 유저 정보
   * @returns 업데이트된 유저
   */
  async updateUser(
    userId: number,
    updateUserDto: Partial<User>,
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 닉네임 변경 시 중복 검사
    if (updateUserDto.nickname && updateUserDto.nickname !== user.nickname) {
      const existingUser = await this.findByNickname(updateUserDto.nickname);
      if (existingUser) {
        throw new BusinessException(
          'NICKNAME_ALREADY_EXISTS',
          HttpStatus.CONFLICT,
        );
      }
    }

    const updatedUser = this.userRepository.merge(user, updateUserDto);
    return await this.userRepository.save(updatedUser);
  }

  /**
   * 닉네임으로 유저를 조회합니다.
   * @param nickname 닉네임
   * @returns 유저 엔티티 또는 null
   */
  async findByNickname(nickname: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { nickname } });
  }

  /**
   * 닉네임 사용 가능 여부를 확인합니다.
   * @param nickname 확인할 닉네임
   * @param currentUserId 현재 사용자 ID (본인 닉네임은 사용 가능)
   * @returns 사용 가능 여부
   */
  async checkNicknameAvailability(
    nickname: string,
    currentUserId?: number,
  ): Promise<boolean> {
    const existingUser = await this.findByNickname(nickname);
    if (!existingUser) return true;
    // 본인의 현재 닉네임이면 사용 가능
    if (currentUserId && existingUser.id === currentUserId) return true;
    return false;
  }

  /**
   * ID로 유저를 조회합니다.
   * @param id 유저 ID
   * @returns 유저 엔티티 또는 null
   */
  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  /**
   * 핸들로 공개 사용자 프로필을 조회합니다.
   * 민감 정보를 제외한 공개 가능한 정보만 반환합니다.
   * @param handle 사용자 핸들
   * @returns 공개 프로필 정보
   */
  async getPublicProfileByHandle(handle: string) {
    // 1. 사용자 기본 정보 조회 (핸들 우선, 없으면 ID로 시도 - 마이그레이션 과도기용)
    let user = await this.userRepository.findOne({
      where: { handle },
      select: [
        'id',
        'nickname',
        'handle',
        'profileImageUrl',
        'createdAt',
        'deletedAt',
        'isReadingLogPublic',
      ],
    });

    // Fallback: 숫자로만 된 문자열이면 ID로 조회 시도
    if (!user && !isNaN(Number(handle))) {
      user = await this.userRepository.findOne({
        where: { id: Number(handle) },
        select: [
          'id',
          'nickname',
          'handle',
          'profileImageUrl',
          'createdAt',
          'deletedAt',
          'isReadingLogPublic',
        ],
      });
    }

    if (!user || user.deletedAt) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const userId = user.id;

    // 2. 통계 조회
    const [salesCount, reviewsCount] = await Promise.all([
      this.usedBookSaleRepository.count({
        where: { user: { id: userId }, status: SaleStatus.FOR_SALE },
      }),
      this.reviewRepository.count({
        where: { user: { id: userId } },
      }),
    ]);

    // 3. 최근 리뷰 3개 조회
    const recentReviews = await this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['book'],
      order: { createdAt: 'DESC' },
      take: 3,
    });

    // 4. 최근 판매글 3개 조회 (판매 중인 것만)
    const recentSales = await this.usedBookSaleRepository.find({
      where: { user: { id: userId } },
      relations: ['book'],
      order: { createdAt: 'DESC' },
      take: 3,
    });

    const readingLogs = user.isReadingLogPublic
      ? await this.getPublicReadingLogs(userId)
      : [];

    return {
      id: user.id,
      handle: user.handle,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
      stats: {
        salesCount,
        reviewsCount,
      },
      recentReviews: recentReviews.map((review) => ({
        id: review.id,
        title: review.title,
        bookTitle: review.book?.title || '',
        bookImage: review.book?.image || null,
        createdAt: review.createdAt,
      })),
      recentSales: recentSales.map((sale) => ({
        id: sale.id,
        bookTitle: sale.book?.title || '',
        bookImage: sale.book?.image || null,
        price: sale.price,
        status: sale.status,
        createdAt: sale.createdAt,
      })),
      readingLogs,
    };
  }

  /**
   * ID로 공개 프로필을 조회합니다.
   * @deprecated 핸들 기반 조회로 마이그레이션 중, getPublicProfileByHandle 사용 권장
   */
  async getPublicProfile(userId: number) {
    return this.getPublicProfileByHandle(userId.toString());
  }

  private async getPublicReadingLogs(userId: number) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const dateString = sixMonthsAgo.toISOString().split('T')[0];

    const logs = await this.dataSource.getRepository(ReadingLog).find({
      where: {
        user: { id: userId },
        date: MoreThanOrEqual(dateString),
      },
      order: { date: 'DESC' },
    });
    return logs;
  }

  /**
   * 특정 사용자가 작성한 모든 중고책 판매글을 조회합니다.
   * @param userId - 사용자 ID
   * @returns 사용자의 판매글 목록
   */
  async findMySales(userId: number): Promise<UsedBookSale[]> {
    return await this.usedBookSaleRepository.find({
      where: { user: { id: userId } },
      relations: ['book', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 유저의 활동 통계(판매글 수, 채팅방 수, 리뷰 수 등)를 조회합니다.
   * @param userId 유저 ID
   * @returns 통계 정보
   */
  async getUserStats(userId: number) {
    // 1. 판매글 통계
    const sales = await this.usedBookSaleRepository.find({
      where: { user: { id: userId } },
      select: ['status'],
    });

    const salesCount = sales.length;
    const salesStatusCounts = sales.reduce(
      (acc, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
        return acc;
      },
      {} as Record<SaleStatus, number>,
    );

    // 2. 채팅방 통계 (활성화된 채팅방 수)
    const chatRoomCount = await this.chatParticipantRepository.count({
      where: { user: { id: userId }, isActive: true },
    });

    // 3. 리뷰 통계
    const reviewsCount = await this.reviewRepository.count({
      where: { user: { id: userId } },
    });

    return {
      salesCount,
      salesStatusCounts,
      chatRoomCount,
      reviewsCount,
    };
  }

  /**
   * 회원 탈퇴를 처리합니다. 유저 정보를 익명화하고 관련 데이터를 정리합니다.
   * @param userId 유저 ID
   */
  async withdraw(userId: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      // 1. 사용자 정보 익명화
      const timestamp = new Date().getTime();
      user.nickname = '(알수없음)';
      user.profileImageUrl = '';
      user.providerId = `deleted_${user.id}_${timestamp}`;
      user.email = `deleted_${user.id}_${timestamp}`;
      user.deletedAt = new Date();

      await queryRunner.manager.save(user);

      // 2. 모든 상품 숨김 처리 (WITHDRAWN)
      await queryRunner.manager.update(
        UsedBookSale,
        { user: { id: userId } },
        { status: SaleStatus.WITHDRAWN },
      );

      // 3. 채팅방 참여 상태 비활성화 (isActive = false)
      await queryRunner.manager.update(
        ChatParticipant,
        { user: { id: userId } },
        { isActive: false },
      );

      // 4. 리뷰 관련 데이터 삭제
      // 4-1. 유저가 남긴 리액션 삭제
      await queryRunner.manager.delete(ReviewReaction, {
        user: { id: userId },
      });
      // 4-2. 유저가 작성한 리뷰 삭제
      await queryRunner.manager.delete(Review, { user: { id: userId } });

      // 5. 위시리스트 삭제
      await queryRunner.manager.delete(Wishlist, { user: { id: userId } });

      // 6. 댓글 좋아요 삭제 (댓글 익명화 전에 처리)
      await queryRunner.manager.delete(CommentLike, { userId });

      // 7. 댓글 익명화 (userId를 null로 설정하여 사용자 연결 해제)
      await queryRunner.manager.update(Comment, { userId }, { userId: null });

      // 8. 독서 기록 삭제
      await queryRunner.manager.delete(ReadingLog, { userId });

      // 9. 읽음 확인 기록 삭제
      await queryRunner.manager.delete(ReadReceipt, { user: { id: userId } });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 위시리스트에 항목을 추가합니다.
   * @param userId 유저 ID
   * @param type 타입 (BOOK, SALE)
   * @param id 대상 ID (ISBN 또는 Sale ID)
   * @param bookData 책 정보 (책이 DB에 없을 경우 생성용)
   * @returns 위시리스트 항목
   */
  async addToWishlist(
    userId: number,
    type: 'BOOK' | 'SALE',
    id: string | number,
    bookData?: BookInfoDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 이미 찜했는지 확인
      const existing = await queryRunner.manager.findOne(Wishlist, {
        where: {
          user: { id: userId },
          ...(type === 'BOOK'
            ? { book: { isbn: id as string } }
            : { usedBookSale: { id: id as number } }),
        },
      });

      if (existing) {
        await queryRunner.commitTransaction();
        return existing;
      }

      const wishlist = new Wishlist();
      wishlist.user = { id: userId } as User;

      if (type === 'BOOK') {
        let book = await queryRunner.manager.findOne(Book, {
          where: { isbn: id as string },
        });

        if (!book) {
          if (bookData) {
            // DB에 책이 없고, 책 정보가 제공된 경우 새로 생성
            book = queryRunner.manager.create(Book, {
              isbn: bookData.isbn,
              title: bookData.title,
              author: bookData.author,
              publisher: bookData.publisher,
              description: bookData.description,
              image: bookData.image,
            });
            await queryRunner.manager.save(book);
          } else {
            throw new BusinessException('BOOK_NOT_FOUND', HttpStatus.NOT_FOUND);
          }
        }
        wishlist.book = book;
      } else {
        const sale = await queryRunner.manager.findOne(UsedBookSale, {
          where: { id: id as number },
        });
        if (!sale) {
          throw new BusinessException('SALE_NOT_FOUND', HttpStatus.NOT_FOUND);
        }
        if (sale.status !== SaleStatus.FOR_SALE) {
          throw new BusinessException(
            'WISHLIST_INVALID_STATUS',
            HttpStatus.BAD_REQUEST,
          );
        }
        wishlist.usedBookSale = sale;
      }

      const savedWishlist = await queryRunner.manager.save(wishlist);
      await queryRunner.commitTransaction();
      return savedWishlist;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 위시리스트에서 항목을 제거합니다.
   * @param userId 유저 ID
   * @param type 타입 (BOOK, SALE)
   * @param id 대상 ID
   * @returns 제거된 항목
   */
  async removeFromWishlist(
    userId: number,
    type: 'BOOK' | 'SALE',
    id: string | number,
  ) {
    const wishlist = await this.wishlistRepository.findOne({
      where: {
        user: { id: userId },
        ...(type === 'BOOK'
          ? { book: { isbn: id as string } }
          : { usedBookSale: { id: id as number } }),
      },
    });

    if (!wishlist) {
      throw new BusinessException('WISHLIST_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return await this.wishlistRepository.remove(wishlist);
  }

  /**
   * 유저의 위시리스트 목록을 조회합니다.
   * @param userId 유저 ID
   * @returns 위시리스트 목록
   */
  async getWishlist(userId: number) {
    return await this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: ['book', 'usedBookSale', 'usedBookSale.book'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 특정 항목이 위시리스트에 있는지 확인합니다.
   * @param userId 유저 ID
   * @param type 타입 (BOOK, SALE)
   * @param id 대상 ID
   * @returns 포함 여부
   */
  async checkWishlistStatus(
    userId: number,
    type: 'BOOK' | 'SALE',
    id: string | number,
  ) {
    const exists = await this.wishlistRepository.exists({
      where: {
        user: { id: userId },
        ...(type === 'BOOK'
          ? { book: { isbn: id as string } }
          : { usedBookSale: { id: id as number } }),
      },
    });
    return { isWishlisted: exists };
  }
}
