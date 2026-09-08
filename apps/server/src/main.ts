import * as dns from 'node:dns';

// Azure 환경에서 Supabase IPv6 ENETUNREACH 에러 우회를 위해 IPv4 우선 조회 강제
dns.setDefaultResultOrder('ipv4first');

import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app/app.module';
import { ActivityTrackingInterceptor } from './shared/activity/interceptors/activity-tracking.interceptor';
import { CacheInvalidationInterceptor } from './shared/cache/interceptors/cache-invalidation.interceptor';
import { SmartCacheInterceptor } from './shared/cache/interceptors/smart-cache.interceptor';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Azure Container Apps 인그레스가 한 단계 앞에 있다. 이 설정이 없으면
  // request.ip가 프록시 주소로 고정되고, 대신 쓰던 x-forwarded-for는 클라이언트가
  // 지어낼 수 있어 조회수 중복 방지와 IP 기반 캐시 키가 통째로 우회된다.
  // 프록시가 덧붙인 마지막 홉만 신뢰한다.
  app.set('trust proxy', 1);

  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());
  // TODO: 운영에서 localhost 오리진을 빼는 것이 맞지만, 실제 사용 중인
  // 오리진(apex/www, 프리뷰 도메인 등)을 확인한 뒤에 조여야 한다. 잘못 조이면
  // 전 요청이 CORS로 막힌다.
  app.enableCors({
    origin: [
      process.env.CLIENT_DOMAIN ?? 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
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

  // 전역 인터셉터 등록. 순서가 동작을 바꾸므로 임의로 섞지 말 것.
  // 로깅(가장 바깥) → 캐시 조회 → 활동 기록 → 캐시 무효화 → 응답 포맷 → 직렬화
  // 캐시가 앞에 있어야 히트 시 뒤쪽 전부를 건너뛰고, 응답 포맷은 캐시에
  // 저장되는 값과 동일하도록 가장 안쪽에 둔다.
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

  // DB 연결 정리는 위의 enableShutdownHooks()가 TypeOrmModule의
  // onApplicationShutdown을 통해 처리한다.

  await app.listen(process.env.PORT ?? 8000, '0.0.0.0');
}
void bootstrap();
