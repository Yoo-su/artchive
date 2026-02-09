# ------------------------------------------------------------------------------
# 1단계: 빌드 (Builder Stage)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

# 작업 디렉토리 설정 (루트 기준)
WORKDIR /app

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@latest --activate

# 1. 워크스페이스(Monorepo) 설정 파일들 복사
# pnpm-lock.yaml은 루트에만 있으므로, 이를 참조하기 위해 루트 파일들을 먼저 가져옵니다.
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# 2. 백엔드 패키지 설정 복사
# 의존성 설치를 위해 백엔드의 package.json만 먼저 가져옵니다.
COPY bookjeok-back/package.json ./bookjeok-back/

# 3. 의존성 설치
# 루트의 lock 파일을 기반으로 모든 의존성을 설치합니다.
RUN pnpm install --frozen-lockfile

# 4. 백엔드 소스 코드 전체 복사
COPY bookjeok-back ./bookjeok-back

# 5. 백엔드 빌드
# 백엔드 폴더로 이동하여 빌드를 수행합니다.
WORKDIR /app/bookjeok-back
RUN pnpm build

# 6. 프로덕션 의존성 정리 (선택 사항, 모노레포에서는 복잡할 수 있어 생략하거나 prune 사용)
# 여기서는 간단하게 build 결과물을 유지합니다.

# ------------------------------------------------------------------------------
# 2단계: 실행 (Runner Stage)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

ENV NODE_ENV production
WORKDIR /app

# node 사용자 사용
USER node

# 빌드 단계에서 생성된 node_modules와 dist 복사
# 모노레포 구조를 유지하며 복사합니다.

# 루트의 node_modules (공용 의존성)
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json

# 백엔드의 빌드 결과물 및 node_modules
COPY --chown=node:node --from=builder /app/bookjeok-back/dist ./bookjeok-back/dist
COPY --chown=node:node --from=builder /app/bookjeok-back/node_modules ./bookjeok-back/node_modules
COPY --chown=node:node --from=builder /app/bookjeok-back/package.json ./bookjeok-back/package.json

# 실행 위치를 백엔드 디렉토리로 변경하지 않고, 루트에서 실행하거나 경로를 지정
WORKDIR /app/bookjeok-back

EXPOSE 3000

# 실행 명령어
CMD ["node", "dist/main"]
