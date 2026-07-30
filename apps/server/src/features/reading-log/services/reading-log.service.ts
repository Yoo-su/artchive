import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

import {
  LOUNGE_MAX_READERS,
  LOUNGE_PAGE_SIZE,
  LOUNGE_POPULAR_COUNT,
  LOUNGE_POPULAR_DAYS,
} from '../constants';
import { CreateReadingLogDto } from '../dto/create-reading-log.dto';
import { UpdateReadingLogDto } from '../dto/update-reading-log.dto';
import { ReadingLog } from '../entities/reading-log.entity';

@Injectable()
export class ReadingLogService {
  constructor(
    @InjectRepository(ReadingLog)
    private readonly readingLogRepository: Repository<ReadingLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 라운지 피드를 조회합니다.
   * 공개 설정된 모든 사용자의 독서 기록을 ISBN별로 그룹화하여 반환합니다.
   * 동일 사용자가 같은 책을 여러 번 읽은 경우 최신 기록만 반영합니다.
   *
   * @param cursor 페이지네이션 커서 (format: "YYYY-MM-DD|isbn")
   * @returns 그룹화된 피드 아이템 + 다음 커서
   */
  async getLoungeFeed(cursor?: string) {
    // 1단계: ISBN별 최신 독서 날짜 조회 (공개 사용자만)
    const subQuery = this.readingLogRepository
      .createQueryBuilder('rl')
      .select('rl.isbn', 'isbn')
      .addSelect('MAX(rl.date)', 'latestDate')
      .innerJoin('rl.user', 'u')
      .where('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .groupBy('rl.isbn')
      .orderBy('"latestDate"', 'DESC')
      .addOrderBy('rl.isbn', 'DESC');

    if (cursor) {
      const [cursorDate, cursorIsbn] = cursor.split('|');
      if (cursorDate && cursorIsbn) {
        subQuery.having(
          '(MAX(rl.date) < :cursorDate OR (MAX(rl.date) = :cursorDate AND rl.isbn < :cursorIsbn))',
          { cursorDate, cursorIsbn },
        );
      }
    }

    subQuery.limit(LOUNGE_PAGE_SIZE + 1);

    const bookGroups: { isbn: string; latestDate: string | Date }[] =
      await subQuery.getRawMany();

    const hasNextPage = bookGroups.length > LOUNGE_PAGE_SIZE;
    if (hasNextPage) bookGroups.pop();

    if (bookGroups.length === 0) {
      return { items: [], nextCursor: null };
    }

    const isbns = bookGroups.map((g) => g.isbn);

    // 2단계: 해당 ISBN들의 독서 기록 + 사용자 정보 + 도서 정보 조회
    const logs = await this.readingLogRepository
      .createQueryBuilder('rl')
      .leftJoinAndSelect('rl.book', 'book')
      .innerJoin('rl.user', 'u')
      .addSelect(['u.id', 'u.nickname', 'u.handle', 'u.profileImageUrl'])
      .where('rl.isbn IN (:...isbns)', { isbns })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .orderBy('rl.date', 'DESC')
      .addOrderBy('rl.createdAt', 'DESC')
      .getMany();

    // 3단계: ISBN별로 그룹화 + 사용자별 최신 기록만 유지 (재독 중복 제거)
    const groupMap = new Map<
      string,
      {
        isbn: string;
        book: any;
        latestDate: string;
        readersMap: Map<number, any>;
      }
    >();

    for (const group of bookGroups) {
      const dateStr =
        group.latestDate instanceof Date
          ? group.latestDate.toISOString().split('T')[0]
          : typeof group.latestDate === 'string'
            ? group.latestDate.split('T')[0]
            : String(group.latestDate);

      groupMap.set(group.isbn, {
        isbn: group.isbn,
        book: null,
        latestDate: dateStr,
        readersMap: new Map(),
      });
    }

    for (const log of logs) {
      const group = groupMap.get(log.isbn);
      if (!group) continue;

      if (!group.book && log.book) {
        group.book = {
          isbn: log.book.isbn,
          title: log.book.title,
          author: log.book.author,
          publisher: log.book.publisher,
          image: log.book.image,
          description: log.book.description,
        };
      }

      // 사용자별 최신 기록만 유지 (이미 있으면 skip - 이미 date DESC 정렬됨)
      if (!group.readersMap.has(log.userId)) {
        group.readersMap.set(log.userId, {
          userId: log.userId,
          nickname: (log as any).user?.nickname || '',
          handle: (log as any).user?.handle || '',
          profileImageUrl: (log as any).user?.profileImageUrl || null,
          date: log.date,
          memo: log.memo || null,
        });
      }
    }

    // 4단계: 응답 포맷으로 변환
    const items = bookGroups.map((bg) => {
      const group = groupMap.get(bg.isbn)!;
      const allReaders = Array.from(group.readersMap.values());

      return {
        isbn: group.isbn,
        book: group.book || {
          isbn: group.isbn,
          title: '제목 정보 없음',
          author: '',
          publisher: '',
          image: null,
          description: '',
        },
        latestDate: group.latestDate,
        readers: allReaders.slice(0, LOUNGE_MAX_READERS),
        totalReaderCount: allReaders.length,
      };
    });

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastGroup = bookGroups[bookGroups.length - 1];
      const formattedLatestDate = groupMap.get(lastGroup.isbn)!.latestDate;
      nextCursor = `${formattedLatestDate}|${lastGroup.isbn}`;
    }

    return { items, nextCursor };
  }

  /**
   * 라운지 인기 도서를 조회합니다.
   * 최근 1년간 가장 많은 사용자가 읽은 도서 Top 10을 반환합니다.
   *
   * @returns 인기 도서 목록
   */
  async getLoungePopular() {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - LOUNGE_POPULAR_DAYS);
    const sinceDateStr = sinceDate.toISOString().split('T')[0];

    // ISBN별 고유 독자 수 집계
    const popularBooks: {
      isbn: string;
      readerCount: string;
    }[] = await this.readingLogRepository
      .createQueryBuilder('rl')
      .select('rl.isbn', 'isbn')
      .addSelect('COUNT(DISTINCT rl.userId)', 'readerCount')
      .innerJoin('rl.user', 'u')
      .where('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .andWhere('rl.date >= :sinceDate', { sinceDate: sinceDateStr })
      .groupBy('rl.isbn')
      .orderBy('"readerCount"', 'DESC')
      .limit(LOUNGE_POPULAR_COUNT)
      .getRawMany();

    if (popularBooks.length === 0) {
      return { items: [] };
    }

    const isbns = popularBooks.map((pb) => pb.isbn);

    // 도서 정보 + 최근 독자 정보 조회
    const logs = await this.readingLogRepository
      .createQueryBuilder('rl')
      .leftJoinAndSelect('rl.book', 'book')
      .innerJoin('rl.user', 'u')
      .addSelect(['u.nickname', 'u.handle', 'u.profileImageUrl'])
      .where('rl.isbn IN (:...isbns)', { isbns })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .andWhere('rl.date >= :sinceDate', { sinceDate: sinceDateStr })
      .orderBy('rl.date', 'DESC')
      .getMany();

    // ISBN별 그룹화
    const bookMap = new Map<string, any>();
    for (const pb of popularBooks) {
      bookMap.set(pb.isbn, {
        isbn: pb.isbn,
        book: null,
        readerCount: Number(pb.readerCount),
        readersSet: new Set<number>(),
        recentReaders: [] as any[],
      });
    }

    for (const log of logs) {
      const entry = bookMap.get(log.isbn);
      if (!entry) continue;

      if (!entry.book && log.book) {
        entry.book = {
          isbn: log.book.isbn,
          title: log.book.title,
          author: log.book.author,
          publisher: log.book.publisher,
          image: log.book.image,
          description: log.book.description,
        };
      }

      if (
        !entry.readersSet.has(log.userId) &&
        entry.recentReaders.length < LOUNGE_MAX_READERS
      ) {
        entry.readersSet.add(log.userId);
        entry.recentReaders.push({
          nickname: (log as any).user?.nickname || '',
          handle: (log as any).user?.handle || '',
          profileImageUrl: (log as any).user?.profileImageUrl || null,
        });
      }
    }

    const items = popularBooks.map((pb) => {
      const entry = bookMap.get(pb.isbn);
      return {
        isbn: entry.isbn,
        book: entry.book || {
          isbn: entry.isbn,
          title: '제목 정보 없음',
          author: '',
          publisher: '',
          image: null,
          description: '',
        },
        readerCount: entry.readerCount,
        recentReaders: entry.recentReaders,
      };
    });

    return { items };
  }

  /**
   * 라운지 열성 독서가를 조회합니다.
   * 최근 3개월간 가장 활발하게 독서 기록을 남긴 공개 사용자 목록을 반환합니다.
   *
   * @param limit 조회할 최대 사용자 수 (기본값: 10)
   * @returns 열성 독서가 목록
   */
  async getLoungeActiveReaders(limit = 10) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sinceDateStr = threeMonthsAgo.toISOString().split('T')[0];

    // 1. 최근 3개월 독서수 및 누적 독서수 집계
    const rawUsers: {
      id: number;
      nickname: string;
      handle: string;
      profileImageUrl: string | null;
      recentCount: string;
      totalCount: string;
    }[] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.readingLogs', 'rl')
      .select([
        'user.id AS id',
        'user.nickname AS nickname',
        'user.handle AS handle',
        'user.profileImageUrl AS "profileImageUrl"',
      ])
      .addSelect('COUNT(rl.id)', 'totalCount')
      .addSelect(
        'COUNT(CASE WHEN rl.date >= :sinceDate THEN 1 END)',
        'recentCount',
      )
      .where('user.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('user.deletedAt IS NULL')
      .setParameter('sinceDate', sinceDateStr)
      .groupBy('user.id')
      .orderBy('"recentCount"', 'DESC')
      .addOrderBy('"totalCount"', 'DESC')
      .limit(limit)
      .getRawMany();

    // 2. 가공하여 최종 결과 반환
    const items = rawUsers.map((ru) => ({
      user: {
        id: ru.id,
        nickname: ru.nickname,
        handle: ru.handle,
        profileImageUrl: ru.profileImageUrl,
      },
      recentCount: parseInt(ru.recentCount || '0', 10),
      totalCount: parseInt(ru.totalCount || '0', 10),
    }));

    return { items };
  }

  /**
   * 특정 도서의 전체 독자 목록을 조회합니다.
   * 상세 모달에서 무한 스크롤로 모든 독자를 보여줄 때 사용됩니다.
   *
   * @param isbn 도서 ISBN
   * @param cursor 페이지네이션 커서 (userId)
   * @returns 독자 목록 + 다음 커서 + 전체 수
   */
  async getLoungeBookReaders(isbn: string, cursor?: string) {
    const PAGE_SIZE = 20;

    // 도서 정보 조회
    const bookEntity = await this.dataSource
      .getRepository('Book')
      .findOne({ where: { isbn } });

    const book = bookEntity
      ? {
          isbn: bookEntity.isbn,
          title: bookEntity.title,
          author: bookEntity.author,
          publisher: bookEntity.publisher,
          image: bookEntity.image,
          description: bookEntity.description,
        }
      : null;

    // 전체 독자 수 (고유 사용자)
    const totalCountResult = await this.readingLogRepository
      .createQueryBuilder('rl')
      .select('COUNT(DISTINCT rl.userId)', 'count')
      .innerJoin('rl.user', 'u')
      .where('rl.isbn = :isbn', { isbn })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .getRawOne();

    const totalCount = Number(totalCountResult?.count || 0);

    // 사용자별 최신 기록만 조회 (서브쿼리로 각 사용자의 최신 date 가져오기)
    const query = this.readingLogRepository
      .createQueryBuilder('rl')
      .innerJoin('rl.user', 'u')
      .addSelect(['u.id', 'u.nickname', 'u.handle', 'u.profileImageUrl'])
      .where('rl.isbn = :isbn', { isbn })
      .andWhere('u.isReadingLogPublic = :isPublic', { isPublic: true })
      .andWhere('u.deletedAt IS NULL')
      .orderBy('rl.date', 'DESC')
      .addOrderBy('rl.createdAt', 'DESC');

    if (cursor) {
      query.andWhere('rl.userId < :cursor', { cursor: Number(cursor) });
    }

    const logs = await query.take(PAGE_SIZE * 3).getMany(); // 여유 있게 가져와서 중복 제거

    // 사용자별 최신 기록만 유지 (재독 중복 제거)
    const seenUsers = new Set<number>();
    const items: any[] = [];

    for (const log of logs) {
      if (seenUsers.has(log.userId)) continue;
      seenUsers.add(log.userId);

      items.push({
        userId: log.userId,
        nickname: (log as any).user?.nickname || '',
        handle: (log as any).user?.handle || '',
        profileImageUrl: (log as any).user?.profileImageUrl || null,
        date: log.date,
        memo: log.memo || null,
      });

      if (items.length >= PAGE_SIZE + 1) break;
    }

    const hasNextPage = items.length > PAGE_SIZE;
    if (hasNextPage) items.pop();

    const nextCursor = hasNextPage
      ? String(items[items.length - 1].userId)
      : null;

    return { book, items, nextCursor, totalCount };
  }

  /**
   * 독서 기록 설정을 조회합니다.
   * @param userId 사용자 ID
   * @returns 독서 기록 공개 여부
   */
  async getSettings(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['isReadingLogPublic'],
    });
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return { isReadingLogPublic: user.isReadingLogPublic };
  }

  /**
   * 독서 기록 설정을 업데이트합니다.
   * @param userId 사용자 ID
   * @param isReadingLogPublic 독서 기록 공개 여부
   * @returns 업데이트된 독서 기록 공개 여부
   */
  async updateSettings(userId: number, isReadingLogPublic: boolean) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BusinessException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    user.isReadingLogPublic = isReadingLogPublic;
    const updatedUser = await this.userRepository.save(user);

    return { isReadingLogPublic: updatedUser.isReadingLogPublic };
  }

  /**
   * 새로운 독서 기록을 생성합니다.
   * @param userId 사용자 ID
   * @param createReadingLogDto 독서 기록 생성 DTO
   * @returns 생성된 독서 기록 엔티티
   */
  async create(userId: number, createReadingLogDto: CreateReadingLogDto) {
    const { isbn, ...data } = createReadingLogDto;
    const log = this.readingLogRepository.create({
      userId,
      ...data,
      isbn,
    });
    const savedLog = await this.readingLogRepository.save(log);

    // 저장 후 도서 정보를 포함하여 다시 조회
    return await this.readingLogRepository.findOne({
      where: { id: savedLog.id },
    });
  }

  /**
   * 특정 월의 독서 기록을 조회합니다.
   * @param userId 유저 ID
   * @param year 연도
   * @param month 월 (1-12)
   * @returns 해당 월의 독서 기록 목록
   */
  async findAllByMonth(userId: number, year: number, month?: number) {
    if (!month) {
      const start = `${year}-01-01`;
      const end = `${year}-12-31`;

      return await this.readingLogRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.book', 'book')
        .where('log.userId = :userId', { userId })
        .andWhere('log.date >= :start AND log.date <= :end', { start, end })
        .orderBy('log.date', 'ASC')
        .getMany();
    }

    const { start, end } = this.getDateRangeOfMonth(year, month);

    return await this.readingLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.book', 'book')
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :start AND log.date <= :end', { start, end })
      .orderBy('log.date', 'ASC')
      .getMany();
  }

  /**
   * 연도와 월을 기반으로 해당 월의 시작일과 종료일(문자열)을 계산합니다.
   */
  private getDateRangeOfMonth(year: number, month: number) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { start, end };
  }

  /**
   * 독서 기록 통계를 조회합니다.
   * @param userId 사용자 ID
   * @param year 연도
   * @param month 월
   */
  async getStats(userId: number, year: number, month: number) {
    const qb = this.readingLogRepository.createQueryBuilder('log');

    // 1. 이번 달 시작일/종료일 계산
    const { start: monthStart, end: monthEnd } = this.getDateRangeOfMonth(
      year,
      month,
    );
    const monthlyCount = await qb
      .clone()
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :start AND log.date <= :end', {
        start: monthStart,
        end: monthEnd,
      })
      .getCount();

    // 2. 올해 시작일/종료일 계산
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    const yearlyCount = await qb
      .clone()
      .where('log.userId = :userId', { userId })
      .andWhere('log.date >= :start AND log.date <= :end', {
        start: yearStart,
        end: yearEnd,
      })
      .getCount();

    return { monthlyCount, yearlyCount };
  }

  /**
   * 독서 기록을 페이지네이션으로 조회합니다. (Infinite Scroll용)
   * @param userId 사용자 ID
   * @param cursorId 마지막으로 로드된 기록의 ID (없으면 처음부터)
   * @param limit 가져올 개수
   */
  async findAllInfinite(userId: number, cursorId?: string, limit = 10) {
    const query = this.readingLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.book', 'book')
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC')
      .addOrderBy('log.createdAt', 'DESC')
      .take(limit + 1);

    if (cursorId) {
      const cursorLog = await this.readingLogRepository.findOne({
        where: { id: cursorId },
      });
      if (cursorLog) {
        query.andWhere(
          '(log.date < :date OR (log.date = :date AND log.createdAt < :createdAt))',
          { date: cursorLog.date, createdAt: cursorLog.createdAt },
        );
      }
    }

    const items = await query.getMany();
    const hasNextPage = items.length > limit;
    if (hasNextPage) {
      items.pop(); // 확인용 +1 제거
    }

    return {
      items,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }

  /**
   * 독서 기록을 수정합니다.
   * @param userId 사용자 ID (본인 확인용)
   * @param id 독서 기록 ID
   * @param updateReadingLogDto 수정할 데이터 DTO
   * @returns 수정된 독서 기록 엔티티
   */
  async update(
    userId: number,
    id: string,
    updateReadingLogDto: UpdateReadingLogDto,
  ) {
    const log = await this.readingLogRepository.findOne({
      where: { id, userId },
    });
    if (!log) {
      throw new BusinessException(
        'READING_LOG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // 변경 사항 적용
    if (updateReadingLogDto.memo !== undefined) {
      log.memo = updateReadingLogDto.memo;
    }

    const updatedLog = await this.readingLogRepository.save(log);

    // 수정 후 도서 정보를 포함하여 다시 조회
    return await this.readingLogRepository.findOne({
      where: { id: updatedLog.id },
    });
  }

  /**
   * 독서 기록을 삭제합니다.
   * @param userId 사용자 ID (본인 확인용)
   * @param id 삭제할 독서 기록 ID
   */
  async remove(userId: number, id: string) {
    const log = await this.readingLogRepository.findOne({
      where: { id, userId },
    });
    if (!log) {
      throw new BusinessException(
        'READING_LOG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.readingLogRepository.remove(log);
  }

  /**
   * 특정 책을 읽은 고유 유저 수를 구합니다.
   */
  async countUniqueReaders(isbn: string): Promise<number> {
    const result = await this.readingLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.userId)', 'count')
      .where('log.isbn = :isbn', { isbn })
      .getRawOne<{ count: string }>();

    return parseInt(result?.count || '0', 10);
  }
}
