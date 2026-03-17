import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReadingLog } from '../entities/reading-log.entity';
import { CreateReadingLogDto } from '../dto/create-reading-log.dto';
import { UpdateReadingLogDto } from '../dto/update-reading-log.dto';
import { User } from '@/features/user/entities/user.entity';
import { BusinessException } from '@/shared/exceptions/business.exception';

@Injectable()
export class ReadingLogService {
  constructor(
    @InjectRepository(ReadingLog)
    private readonly readingLogRepository: Repository<ReadingLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
    const log = this.readingLogRepository.create({
      userId,
      ...createReadingLogDto,
    });
    return await this.readingLogRepository.save(log);
  }

  /**
   * 특정 연/월의 독서 기록 목록을 조회합니다.
   * @param userId 사용자 ID
   * @param year 조회할 연도 (YYYY)
   * @param month 조회할 월 (MM)
   * @returns 해당 월의 독서 기록 리스트
   */
  async findAllByMonth(userId: number, year: number, month: number) {
    // TypeORM과 Postgres의 date 타입을 사용하여 해당 연/월의 기록을 조회합니다.
    return await this.readingLogRepository
      .createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .andWhere("TO_CHAR(log.date, 'YYYY-MM') = :monthStr", {
        monthStr: `${year}-${String(month).padStart(2, '0')}`,
      })
      .orderBy('log.date', 'ASC')
      .getMany();
  }

  /**
   * 독서 기록 통계를 조회합니다.
   * @param userId 사용자 ID
   * @param year 연도
   * @param month 월
   */
  async getStats(userId: number, year: number, month: number) {
    const qb = this.readingLogRepository.createQueryBuilder('log');

    // 이번 달 읽은 권수
    const monthlyCount = await qb
      .clone()
      .where('log.userId = :userId', { userId })
      .andWhere("TO_CHAR(log.date, 'YYYY-MM') = :monthStr", {
        monthStr: `${year}-${String(month).padStart(2, '0')}`,
      })
      .getCount();

    // 올해 읽은 권수
    const yearlyCount = await qb
      .clone()
      .where('log.userId = :userId', { userId })
      .andWhere("TO_CHAR(log.date, 'YYYY') = :yearStr", {
        yearStr: String(year),
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
      .where('log.userId = :userId', { userId })
      .orderBy('log.date', 'DESC') // 최근 날짜 순
      .addOrderBy('log.createdAt', 'DESC') // 같은 날짜면 최신 작성 순
      .take(limit + 1); // 다음 페이지 존재 여부 확인을 위해 +1

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

    return await this.readingLogRepository.save(log);
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
}
