# ==============================================================================
# 1단계: 의존성 설치 (Deps Stage)
# ==============================================================================
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# 모노레포 설정 파일 및 각 패키지의 package.json 복사
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json turbo.json .npmrc ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/core/package.json ./packages/core/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/react-query/package.json ./packages/react-query/

# pnpm 설치 및 의존성 설치
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
RUN pnpm install --frozen-lockfile

# ==============================================================================
# 2단계: 빌드 (Builder Stage)
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드타임 환경변수
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm build --filter=@bookjeok/admin...

# ==============================================================================
# 3단계: 실행 (Runner Stage)
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/admin/server.js"]
