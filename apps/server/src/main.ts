// 애플리케이션 전역 타임존을 한국/서울(KST)로 설정
// 모든 Date 객체, TypeORM 타임스탬프, 로깅 등에 적용됨
process.env.TZ = 'Asia/Seoul';

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { DataSource } from 'typeorm';

import { AppModule } from './app/app.module';
import { ActivityTrackingInterceptor } from './shared/activity/interceptors/activity-tracking.interceptor';
import { CacheInvalidationInterceptor } from './shared/cache/interceptors/cache-invalidation.interceptor';
import { SmartCacheInterceptor } from './shared/cache/interceptors/smart-cache.interceptor';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.CLIENT_DOMAIN ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-idempotency-key',
    ],
  });

  // 전역 필터 등록 (에러 응답 표준화)
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 전역 인터셉터 등록 (로깅이 먼저, 그 다음 응답 변환, 그 다음 활동/캐싱)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    app.get(SmartCacheInterceptor),
    app.get(ActivityTrackingInterceptor),
    app.get(CacheInvalidationInterceptor),
    new TransformInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // 전역 파이프 등록 (입력값 검증)
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('bookjeok API')
    .setDescription('bookjeok API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const dataSource = app.get(DataSource);

  app
    .getHttpAdapter()
    .getInstance()
    .on('close', async () => {
      console.log('Server is closing, closing database connection...');
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('Database connection closed.');
      }
    });

  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}
void bootstrap();
