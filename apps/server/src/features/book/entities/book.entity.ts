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

  @Column({ default: '' })
  discount: string;

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
