import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('llm_talk_log')
export class LlmTalkLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  userId?: string;

  @Column({ type: 'text' })
  userMessage: string;

  @Column({ type: 'text' })
  aiMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  recommendedBooks?: Record<string, any>[];

  @Column({ type: 'text', nullable: true })
  model: string;

  @Column({ type: 'int', nullable: true })
  latency: number; // in milliseconds

  @CreateDateColumn()
  createdAt: Date;
}
