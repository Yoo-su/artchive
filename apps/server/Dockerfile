# ------------------------------------------------------------------------------
# 1단계: 빌드 (Builder Stage)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

# 작업 디렉토리 설정 (루트 기준)
WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# 1. 워크스페이스(Monorepo) 설정 파일들 복사
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json turbo.json .npmrc ./

# 2. 모든 패키지 및 앱의 package.json 복사 (의존성 설치 최적화)
COPY apps/server/package.json ./apps/server/
COPY packages/core/package.json ./packages/core/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/react-query/package.json ./packages/react-query/

# 3. 의존성 설치
RUN pnpm install --frozen-lockfile

# 4. 소스 코드 전체 복사 (packages 포함)
COPY packages ./packages
COPY apps/server ./apps/server

# 5. 백엔드 빌드 (Turbo 활용)
RUN pnpm build --filter=@bookjeok/server

# ------------------------------------------------------------------------------
# 2단계: 실행 (Runner Stage)
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

ENV NODE_ENV production
ENV TZ Asia/Seoul
WORKDIR /app

# node 사용자 사용
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

# 빌드 결과물 복사
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/packages ./packages

# 실행 위치 설정
WORKDIR /app/apps/server

# 포트 설정 (main.ts의 설정인 8000으로 수정)
EXPOSE 8000

# 실행 명령어
CMD ["node", "dist/main"]
