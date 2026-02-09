# ------------------------------------------------------------------------------
# 1단계: 의존성 설치 (Deps Stage)
# package.json과 lock 파일만 복사하여 의존성을 설치합니다.
# 캐싱을 최적화하기 위해 별도 단계로 분리합니다.
# ------------------------------------------------------------------------------
FROM node:22-alpine AS deps

# libc6-compat 설치: 일부 네이티브 모듈(예: sharp, swc)이 alpine에서 동작하기 위해 필요할 수 있습니다.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 패키지 매니저 설정
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# ------------------------------------------------------------------------------
# 2단계: 빌드 (Builder Stage)
# 소스 코드를 복사하고 Next.js 애플리케이션을 빌드합니다.
# ------------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# pnpm 설정
RUN corepack enable && corepack prepare pnpm@latest --activate

# 이전 단계에서 설치한 node_modules 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 빌드 실행
# next.config.ts에 output: 'standalone' 설정이 되어 있어야 최적화된 빌드가 생성됩니다.
RUN pnpm build

# ------------------------------------------------------------------------------
# 3단계: 실행 (Runner Stage)
# 실제 운영 환경에서 실행될 가벼운 이미지입니다.
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# 보안을 위해 시스템 그룹/유저 생성 및 사용
# root 권한으로 실행하지 않도록 합니다.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js의 public 폴더 복사 (이미지, 폰트 등 정적 파일)
COPY --from=builder /app/public ./public

# 'standalone' 빌드 결과물 복사
# standalone 모드는 실행에 필요한 최소한의 파일만 .next/standalone에 생성합니다.
# 따라서 node_modules 전체를 복사할 필요가 없어 이미지 크기가 획기적으로 줄어듭니다.

# 보안을 위해 파일 소유권을 nextjs 유저로 변경
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 실행 유저 변경
USER nextjs

# 포트 설정
EXPOSE 3000
ENV PORT 3000

# 서버 실행
# standalone 모드에서는 'next start'가 아닌 생성된 'server.js'를 node로 직접 실행합니다.
CMD ["node", "server.js"]
