import { CacheModule } from '@nestjs/cache-manager';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { ArtModule } from '@/features/art/art.module';
import { AuthModule } from '@/features/auth/auth.module';
import { BookModule } from '@/features/book/book.module';
import { Book } from '@/features/book/entities/book.entity';
import { ChatModule } from '@/features/chat/chat.module';
import { CommentModule } from '@/features/comment/comment.module';
import { HealthModule } from '@/features/health/health.module';
import { InsightsModule } from '@/features/insights/insights.module';
import { LlmModule } from '@/features/llm/llm.module';
import { NotificationModule } from '@/features/notification/notification.module';
import { ReadingLog } from '@/features/reading-log/entities/reading-log.entity';
import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { Review } from '@/features/review/entities/review.entity';
import { ReviewModule } from '@/features/review/review.module';
import { SearchKeywordModule } from '@/features/search-keyword/search-keyword.module';
import { UsedBookSale } from '@/features/used-book-sale/entities/used-book-sale.entity';
import { UsedBookSaleModule } from '@/features/used-book-sale/used-book-sale.module';
import { User } from '@/features/user/entities/user.entity';
import { ActivityLog } from '@/shared/activity/entities/activity-log.entity';
import { ActivityModule } from '@/shared/activity/activity.module';
import { SmartCacheModule } from '@/shared/cache/smart-cache.module';
import { UserModule } from '@/features/user/user.module';

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
        entities: [User, Book, UsedBookSale, Review, ReadingLog, ActivityLog],
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // 개발 환경에서만 true로 설정
        autoLoadEntities: true,
        extra: {
          max: 40,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
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
    ArtModule,
    UsedBookSaleModule,
    ChatModule,
    LlmModule,
    ReviewModule,
    CommentModule,
    InsightsModule,
    ReadingLogModule,
    SearchKeywordModule,
    NotificationModule,
    HealthModule,
    ActivityModule,
    SmartCacheModule,
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
