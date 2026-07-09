# ==============================================================================
# 1단계: 의존성 설치 (Deps Stage)
# 소스 코드 변경 시에도 캐시를 활용하여 의존성 설치를 건너뛰기 위해 분리
# ==============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# 모노레포 설정 파일 및 각 패키지의 package.json 복사
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json turbo.json .npmrc ./
COPY apps/server/package.json ./apps/server/
COPY apps/admin/package.json ./apps/admin/
COPY packages/core/package.json ./packages/core/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/react-query/package.json ./packages/react-query/

# pnpm 설치 및 의존성 설치
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
RUN pnpm install --frozen-lockfile

# ==============================================================================
# 2단계: 빌드 (Builder Stage)
# deps 단계의 node_modules를 가져와 NestJS 앱을 빌드 (TypeScript → JavaScript)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# deps 단계에서 설치한 node_modules 가져오기
COPY --from=deps /app/node_modules ./node_modules

# 필요한 소스 코드만 선별 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json .npmrc ./
COPY packages ./packages
COPY apps/server ./apps/server
COPY apps/admin/package.json ./apps/admin/package.json

# server 앱과 의존 패키지를 함께 빌드
RUN pnpm build --filter=@bookjeok/server...

# ==============================================================================
# 3단계: 실행 (Runner Stage)
# 프로덕션 의존성과 빌드 결과물(dist/)만 포함하는 최종 경량 이미지
# ==============================================================================
FROM node:22-alpine AS runner

ENV NODE_ENV=production
ENV TZ=Asia/Seoul

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# 프로덕션 의존성 설치를 위한 설정 파일 복사
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/.npmrc ./.npmrc
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY --from=builder /app/apps/admin/package.json ./apps/admin/package.json

# 공유 패키지의 package.json만 복사 (pnpm workspace 해석에 필요)
# packages는 웹에서만 사용하므로 dist(빌드 결과물)는 복사하지 않음
COPY --from=builder /app/packages/core/package.json ./packages/core/package.json
COPY --from=builder /app/packages/api-client/package.json ./packages/api-client/package.json
COPY --from=builder /app/packages/react-query/package.json ./packages/react-query/package.json

# devDependencies 제외, 프로덕션 의존성만 설치
RUN pnpm install --prod --frozen-lockfile

# NestJS 빌드 결과물 복사
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# 비-root 유저 생성 및 전환 (보안)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

USER nestjs
WORKDIR /app/apps/server

EXPOSE 8000

CMD ["node", "dist/main"]
