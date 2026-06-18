import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Book } from '@/features/book/entities/book.entity';

@Entity({ name: 'ai_book_summaries' })
export class AiBookSummary {
  @PrimaryColumn()
  isbn: string;

  @OneToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'isbn' })
  book: Book;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb' })
  keyPoints: string[];

  @Column({ type: 'text' })
  targetAudience: string;

  @Column({ type: 'jsonb' })
  keywords: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
