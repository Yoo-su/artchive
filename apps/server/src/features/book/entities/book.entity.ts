import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';

@Entity({ name: 'books' })
export class Book {
  @PrimaryColumn()
  isbn: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column()
  publisher: string;

  /**
   * 기준가. 알라딘 종료(2026-10-30) 전까지는 알라딘 판매가가 들어 있었으나,
   * 판매가는 벤더의 프로모션이라 갱신이 끊기면 곧 썩습니다. 그래서 **정가**로
   * 의미를 바꿉니다. 정가는 판(edition)의 속성이라 갱신할 필요가 없습니다.
   * 중고 판매글의 "N% OFF"도 정가 기준이 맞습니다.
   */
  @Column({ default: '' })
  discount: string;

  /**
   * 출간일. 최초 스키마가 네이버 API 기준이라 이 필드가 없었고, 그래서
   * 신간순 정렬을 구현할 수 없었습니다(`createdAt`은 우리가 적재한 시각이라
   * 대신 쓸 수 없습니다).
   *
   * 공급처가 주지 않거나 알라딘에 없는 도서가 있어 nullable입니다.
   */
  @Column({ type: 'date', nullable: true })
  pubDate?: Date | null;

  @Column({ type: 'text' })
  description: string;

  @Column()
  image: string;

  @OneToMany(() => UsedBookSale, (sale) => sale.book)
  usedBookSales: UsedBookSale[];

  @Column({ default: 0 })
  viewCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
