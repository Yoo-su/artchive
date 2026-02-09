# ------------------------------------------------------------------------------
# 1단계: 빌드 (Builder Stage)
# 애플리케이션을 빌드하기 위한 임시 단계입니다.
# 필요한 모든 의존성을 설치하고 소스 코드를 컴파일합니다.
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# pnpm 패키지 매니저 설치 (Corepack 활성화)
# Node.js 16.13.0 이상부터는 Corepack이 포함되어 있어 pnpm을 쉽게 활성화할 수 있습니다.
RUN corepack enable && corepack prepare pnpm@latest --activate

# 의존성 설치를 위해 패키지 파일만 먼저 복사
# 이유: 소스 코드가 변경되어도 의존성이 변경되지 않았다면,
# Docker의 레이어 캐시 기능을 이용하여 'pnpm install' 단계를 건너뛸 수 있어 빌드 속도가 빨라집니다.
COPY package.json pnpm-lock.yaml ./

# 의존성 설치 (--frozen-lockfile: lock 파일과 일치하는 버전만 설치하여 안정성 확보)
RUN pnpm install --frozen-lockfile

# 소스 코드 전체 복사
COPY . .

# NestJS 애플리케이션 빌드 (dist 폴더 생성)
RUN pnpm build

# 프로덕션 의존성만 남기기 위한 준비
# 빌드 도구 등을 제외하고 실제 실행에 필요한 패키지만 남겨 이미지 크기를 줄입니다.
RUN pnpm prune --prod

# ------------------------------------------------------------------------------
# 2단계: 실행 (Runner Stage)
# 실제 서비스 운영에 사용될 가볍고 안전한 최종 이미지입니다.
# 빌드 단계에서 생성된 결과물만 가져와서 실행합니다.
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

# 환경 변수 설정 (프로덕션 모드)
ENV NODE_ENV production

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 보안을 위해 root 권한이 아닌 node 사용자로 실행
# Docker 이미지는 기본적으로 root로 실행되지만, 보안상 권장되지 않습니다.
USER node

# 빌드 단계(builder)에서 생성된 파일들만 복사해옵니다.
# --chown=node:node 옵션으로 파일 소유권을 node 사용자에게 변경합니다.

# 1. 설치된 프로덕션 의존성 복사 (node_modules)
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules

# 2. 빌드된 애플리케이션 코드 복사 (dist)
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# 포트 노출 (문서화 목적)
EXPOSE 3000

# 애플리케이션 실행 명령어
# node 명령어로 빌드된 결과물(main.js)을 실행합니다.
CMD ["node", "dist/main"]
