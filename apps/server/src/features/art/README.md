# Art Feature (문화예술 정보)

KOPIS(공연예술통합전산망) 공공 API를 프록시하여 공연·전시 목록과 상세 정보를 제공하는 모듈입니다.

## 폴더 구조

```
art/
├── art.module.ts
├── controllers/art.controller.ts
└── services/art.service.ts
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/art/external/list` | 공연 목록 조회 |
| GET | `/art/external/detail/:id` | 공연 상세 조회 |

### 목록 쿼리 파라미터

| 파라미터 | 설명 |
|---|---|
| `cpage` | 페이지 번호 |
| `rows` | 페이지당 건수 |
| `prfstate` | 공연 상태 (공연중/공연예정 등) |
| `startDate` / `endDate` | 조회 기간 |
| `genreCode` | 장르 코드 |
| `signgucode` | 지역 코드 |

## 왜 프록시인가

1. **API 키 은닉** — `CULTURE_SERVICE_KEY`를 브라우저에 노출하지 않습니다.
2. **XML → JSON 변환** — KOPIS는 XML로 응답합니다. `fast-xml-parser`로 파싱해 `@bookjeok/core`의 `ArtItem` / `ArtDetailItem` 형태로 정규화합니다.
3. **CORS** — 공공 API는 브라우저 직접 호출을 허용하지 않습니다.

`CULTURE_SERVICE_KEY`가 없으면 `500`을 반환합니다.

## 프론트엔드

- 라우트: `/art/[id]` (`art-detail-view`)
- 기능 폴더: [`apps/web/src/features/art`](../../../../web/src/features/art/README.md)
- 웹 라우트 핸들러 `/api/art-list`, `/api/art-detail/[id]`가 ISR 캐싱 계층으로 한 겹 더 감쌉니다.
