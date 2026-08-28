import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '@/features/user/entities/user.entity';

import { Order } from './order.entity';

export enum TradeReviewTag {
  // 긍정 태그 (5종)
  GOOD_CONDITION = 'GOOD_CONDITION', // 책 상태가 설명과 같아요
  FAST_RESPONSE = 'FAST_RESPONSE', // 응답이 빨라요
  FAST_SHIPPING = 'FAST_SHIPPING', // 배송이 빨라요
  METICULOUS_PACKAGING = 'METICULOUS_PACKAGING', // 포장이 꼼꼼해요
  KIND_MANNER = 'KIND_MANNER', // 친절하고 매너가 좋아요

  // 부정 태그 (4종)
  BAD_CONDITION = 'BAD_CONDITION', // 책 상태가 설명과 달라요
  SLOW_RESPONSE = 'SLOW_RESPONSE', // 응답이 느려요
  LATE_SHIPPING = 'LATE_SHIPPING', // 배송이 늦었어요
  POOR_PACKAGING = 'POOR_PACKAGING', // 포장이 부실해요
}

@Entity({ name: 'trade_reviews' })
@Index(['targetUserId', 'createdAt'])
export class TradeReview {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.tradeReview, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'varchar' })
  orderId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewerId' })
  reviewer: User;

  @Column()
  reviewerId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetUserId' })
  targetUser: User;

  @Column()
  targetUserId: number;

  @Column('simple-array')
  tags: string[];

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
