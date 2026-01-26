import { Module, OnModuleInit } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { AuthModule } from '@/features/auth/auth.module';
import { UserModule } from '@/features/user/user.module';
import { User } from '@/features/user/entities/user.entity';
import { BookModule } from '@/features/book/book.module';
import { UsedBookSaleModule } from '@/features/used-book-sale/used-book-sale.module';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { Book } from '@/features/book/entities/book.entity';
import { ChatModule } from '@/features/chat/chat.module';
import { LlmModule } from '@/features/llm/llm.module';
import { ReviewModule } from '@/features/review/review.module';
import { Review } from '@/features/review/entities/review.entity';
import { CommentModule } from '@/features/comment/comment.module';
import { InsightsModule } from '@/features/insights/insights.module';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { SearchKeywordModule } from '@/features/search-keyword/search-keyword.module';
import { NotificationModule } from '@/features/notification/notification.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // Rate Limiting 설정 (1분에 100개 요청)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60초 (1분)
        limit: 100, // 100개 요청
      },
    ]),
    CacheModule.register({
      isGlobal: true,
      ttl: 0, // 기본 TTL, 인터셉터에서 재정의됨
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Book, UsedBookSale, Review, ReadingLog],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // 개발 환경에서만 true로 설정
        autoLoadEntities: true,
        extra: {
          max: 5,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
        // SSL 설정 (Supabase 필수)
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    AuthModule,
    UserModule,
    BookModule,
    UsedBookSaleModule,
    ChatModule,
    LlmModule,
    ReviewModule,
    CommentModule,
    InsightsModule,
    ReadingLogModule,
    SearchKeywordModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [
    // 전역 Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS cube');
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS earthdistance');
  }
}
