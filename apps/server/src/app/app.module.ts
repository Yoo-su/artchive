import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ArtModule } from '@/features/art/art.module';
import { AuthModule } from '@/features/auth/auth.module';
import { BookModule } from '@/features/book/book.module';
import { ChatModule } from '@/features/chat/chat.module';
import { CommentModule } from '@/features/comment/comment.module';
import { HealthModule } from '@/features/health/health.module';
import { InsightsModule } from '@/features/insights/insights.module';
import { LlmModule } from '@/features/llm/llm.module';
import { NotificationModule } from '@/features/notification/notification.module';
import { ReadingLogModule } from '@/features/reading-log/reading-log.module';
import { ReviewModule } from '@/features/review/review.module';
import { SearchModule } from '@/features/search/search.module';
import { SearchKeywordModule } from '@/features/search-keyword/search-keyword.module';
import { UsedBookSaleModule } from '@/features/used-book-sale/used-book-sale.module';
import { UserModule } from '@/features/user/user.module';
import { WishlistModule } from '@/features/wishlist/wishlist.module';
import { ActivityModule } from '@/shared/activity/activity.module';
import { SmartCacheModule } from '@/shared/cache/smart-cache.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? undefined
          : ['.env', '../../.env'],
    }),

    // 전역 비동기 이벤트 시스템 활성화
    EventEmitterModule.forRoot(),

    // 전역 Rate Limiting (1분당 최대 120회 요청 허용)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),

    // 전역 캐시 모듈
    CacheModule.register({
      isGlobal: true,
      ttl: 0,
    }),

    // TypeORM 비동기 연결 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        autoLoadEntities: true,
        extra: {
          max: 40,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        },
        ssl:
          process.env.NODE_ENV === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),

    // 비즈니스 도메인 기능 모듈
    AuthModule,
    UserModule,
    BookModule,
    ReviewModule,
    CommentModule,
    ReadingLogModule,
    WishlistModule,
    UsedBookSaleModule,
    ChatModule,
    LlmModule,
    ArtModule,
    InsightsModule,
    SearchKeywordModule,
    SearchModule,
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
export class AppModule {}
