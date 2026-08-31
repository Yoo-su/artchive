# 04. 핵심 체크리스트 및 빌드 검증

> AI 에이전트 및 개발자가 코드 수정/생성 전후로 반드시 확인해야 하는 체크리스트입니다.

---

## 1. 10대 핵심 체크리스트

1. **API 경로**: `API_PATHS` (core) 사용. 문자열 경로 하드코딩 절대 금지.
2. **라우트 경로**: `PATHS` (web shared constants) 사용. `router.push("/...")` 하드코딩 금지.
3. **에러 처리**: `BusinessException` + `ERROR_CODES` 등록 코드 사용. 직접 `HttpException` 금지.
4. **쿼리 키**: `@lukemorales/query-key-factory` 기반 키 사용. 인라인 문자열 배열 금지.
5. **Directives**: `@bookjeok/react-query`의 모든 훅 파일 최상단에 `"use client";` 선언.
6. **Query/Mutation 분리**: react-query 패키지 내 `queries.ts`와 `mutations.ts` 명확히 분리.
7. **새 모듈 등록**: `apps/server/src/app/app.module.ts`의 imports에 신규 기능 모듈 등록 필수.
8. **index.ts export**: `core`, `api-client`, `react-query`에 새 기능 추가 시 루트 `index.ts`에 export 필수 등록.
9. **서버 Import Alias**: 서버 코드에서는 항상 `@/features/...`, `@/shared/...` 사용 (`../../` 상대경로 지양).
10. **엔티티 타임스탬프**: Date 컬럼에 `@CreateDateColumn({ type: 'timestamptz' })` 사용.

---

## 2. 빌드 및 테스트 검증 커맨드

```bash
# 1. 공용 패키지 빌드 (의존 관계 순서)
pnpm --filter @bookjeok/core build
pnpm --filter @bookjeok/api-client build
pnpm --filter @bookjeok/react-query build

# 2. 전체 모노레포 빌드 검증
pnpm build

# 3. 린트 검사
pnpm lint

# 4. 전체 단위/통합 테스트 실행
pnpm test
```
