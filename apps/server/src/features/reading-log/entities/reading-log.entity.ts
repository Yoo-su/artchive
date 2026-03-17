import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@/features/user/entities/user.entity';

@Entity({ name: 'reading_logs' })
export class ReadingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: number;

  @ManyToOne(() => User, (user) => user.readingLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  bookIsbn: string;

  @Column()
  bookTitle: string;

  @Column()
  bookImage: string;

  @Column()
  bookAuthor: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD 형식

  @Column({ length: 100, nullable: true })
  memo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
