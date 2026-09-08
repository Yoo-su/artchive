# CLAUDE.md

이 저장소의 규칙은 **[AGENTS.md](AGENTS.md)** 한 곳에서 관리합니다.
작업을 시작하기 전에 그 문서와 거기서 링크하는 `.agents/rules/`의 4개 파일을 읽으세요.

문서를 두 벌로 나누면 한쪽이 반드시 낡습니다. 규칙을 고칠 일이 생기면
이 파일이 아니라 `AGENTS.md`나 `.agents/rules/`를 고치세요.

## 특히 먼저 볼 것

- **[docs/book-data-migration-plan.md](docs/book-data-migration-plan.md)** — 알라딘 Open API가
  2026-10-30에 종료돼 도서 데이터를 외부 API 의존에서 떼어내는 작업이 진행 중입니다.
  도서 관련 코드를 건드리기 전에 반드시 읽고, 작업 후 체크박스와 진행 로그를 갱신하세요.
  9-c에는 **이미 검토하고 기각한 제안들**이 근거와 함께 적혀 있습니다. 같은 논의를
  반복하지 않으려면 그 절을 먼저 보세요.
- **[docs/manual-ddl-log.md](docs/manual-ddl-log.md)** — 운영 DB에는 마이그레이션 도구가
  없습니다. 엔티티를 바꿨으면 DDL을 수동 적용하고 여기 기록하세요.
