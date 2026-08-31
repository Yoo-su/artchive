# 북적(bookjeok) 코드베이스 컨벤션

이 문서는 모듈별 규칙 파일로 분할 관리되고 있습니다. 세부 규칙은 아래 파일들을 참조하십시오:

- [01-monorepo-packages.md](file:///c:/projects/bookjeok/.agents/rules/01-monorepo-packages.md): 모노레포 아키텍처, Contract-First, 공유 패키지(`core`, `api-client`, `react-query`) 규칙
- [02-server-conventions.md](file:///c:/projects/bookjeok/.agents/rules/02-server-conventions.md): NestJS 서버, TypeORM(`timestamptz`), CLS 트랜잭션, `BusinessException` & `ERROR_CODES`, DTO 규격
- [03-frontend-conventions.md](file:///c:/projects/bookjeok/.agents/rules/03-frontend-conventions.md): Next.js 15 Web/Admin, 라우트 상수(`PATHS`), Zustand 스토어, 실시간 이벤트, UI 피드백
- [04-checklist.md](file:///c:/projects/bookjeok/.agents/rules/04-checklist.md): 10대 핵심 체크리스트 및 빌드/테스트 검증 커맨드
