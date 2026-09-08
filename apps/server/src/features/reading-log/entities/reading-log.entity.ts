import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';
import { User } from '@/features/user/entities/user.entity';

@Entity({ name: 'reading_logs' })
@Index(['isbn', 'date']) // 라운지 피드 (isbn별 그룹화 및 최신 날짜 정렬) 용도
@Index(['date']) // 라운지 인기작 (최근 N일 조회) 용도
@Index(['userId', 'date']) // 개인 독서 기록 조회 용도
export class ReadingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.readingLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  isbn: string;

  /**
   * 도서 삭제를 막습니다(NO ACTION). 독서기록은 사용자가 직접 남긴 기록이라
   * 도서 행이 사라진다고 조용히 끊기면 안 됩니다.
   *
   * 전에는 `onDelete: 'SET NULL'`로 선언돼 있었는데 위 `isbn`이 NOT NULL이라
   * 성립할 수 없는 조합이었고, 운영에는 FK 자체가 없어 그 모순이 드러나지
   * 않았습니다. 2026-09-09에 제약을 걸면서 선언을 실제와 맞췄습니다
   * (`docs/manual-ddl-log.md` 7번). `reviews`와 같은 규칙입니다.
   */
  @ManyToOne(() => Book)
  @JoinColumn({ name: 'isbn' })
  book: Book;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD 형식

  @Column({ length: 100, nullable: true })
  memo: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
