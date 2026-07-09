import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { ChatParticipant } from '@/features/chat/entities/chat-participant.entity';
import { ReadReceipt } from '@/features/chat/entities/read-receipt.entity';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { Review } from '@/features/review/entities/review.entity';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

@Entity({ name: 'users' })
@Unique(['provider', 'providerId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string;

  @Column({ name: 'providerId' })
  providerId: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Exclude()
  @Column({ nullable: true })
  password: string;

  @Column()
  nickname: string;

  @Column({ unique: true, nullable: true })
  handle: string;

  @Column({ name: 'profileImageUrl', nullable: true })
  profileImageUrl: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ default: true })
  isReadingLogPublic: boolean;

  @Column({ nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'varchar', default: 'USER' })
  role: 'USER' | 'ADMIN';

  @OneToMany(() => UsedBookSale, (sale) => sale.user)
  usedBookSales: UsedBookSale[];

  @OneToMany(() => ChatParticipant, (participant) => participant.user)
  chatParticipants: ChatParticipant[];

  @OneToMany(() => ReadReceipt, (receipt) => receipt.user)
  readReceipts: ReadReceipt[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => ReadingLog, (readingLog) => readingLog.user)
  readingLogs: ReadingLog[];
}
