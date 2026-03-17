import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsedBookSale } from './entities/used-book-sale.entity';
import { UsedBookSaleController } from './controllers/used-book-sale.controller';
import { UsedBookSaleService } from './services/used-book-sale.service';
import { UsedBookViewCountInterceptor } from './interceptors/used-book-view-count.interceptor';
import { BookModule } from '../book/book.module';
import { UserModule } from '../user/user.module';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsedBookSale]),
    BookModule, // Book 엔티티와 BookService 사용
    UserModule,
  ],
  controllers: [UsedBookSaleController],
  providers: [UsedBookSaleService, UsedBookViewCountInterceptor],
  exports: [UsedBookSaleService],
})
export class UsedBookSaleModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 모듈 초기화 시 GiST 인덱스 생성 (거리 기반 검색 최적화)
   */
  async onModuleInit() {
    await this.dataSource.query(
      'CREATE INDEX IF NOT EXISTS "used_book_sales_location_idx" ON "used_book_sales" USING GiST (ll_to_earth("latitude", "longitude"))',
    );
  }
}
