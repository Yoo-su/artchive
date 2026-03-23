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
import { Book } from '@/features/book/entities/book.entity';

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
  isbn: string;

  @ManyToOne(() => Book, { eager: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'isbn' })
  book: Book;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD 형식

  @Column({ length: 100, nullable: true })
  memo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
