# ==============================================================================
# 1단계: 의존성 설치 (Deps Stage)
# 소스 코드 변경 시에도 캐시를 활용하여 의존성 설치를 건너뛰기 위해 분리
# ==============================================================================
FROM node:22-alpine AS deps

# Alpine 네이티브 모듈 호환성 패키지
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 모노레포 설정 파일 및 각 패키지의 package.json 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/core/package.json ./packages/core/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/react-query/package.json ./packages/react-query/

# pnpm 설치 및 의존성 설치
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
RUN pnpm install --frozen-lockfile

# ==============================================================================
# 2단계: 빌드 (Builder Stage)
# deps 단계의 node_modules를 가져와 Next.js 앱을 빌드
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

# deps 단계에서 설치한 node_modules 가져오기
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 빌드타임 환경변수 주입을 위한 ARG/ENV 정의
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# web 앱과 의존 패키지를 함께 빌드
RUN pnpm build --filter=@bookjeok/web...

# ==============================================================================
# 3단계: 실행 (Runner Stage)
# standalone 빌드 결과물만 포함하는 최종 경량 이미지
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# 비-root 유저 생성 및 전환 (보안)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 빌드 결과물 및 정적 파일 복사
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/web/server.js"]
