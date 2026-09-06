# 도서 데이터 탈(脫) 외부 API 마이그레이션 계획

**상태: 진행 중 · 최종 갱신 2026-09-05**

알라딘 Open API 종료에 대응해 도서 데이터(표지·서지·검색)를 외부 사기업 API
의존에서 떼어내는 작업의 단일 기준 문서입니다. 여러 세션에 걸쳐 진행되므로
**작업을 마칠 때마다 이 문서의 체크박스와 「진행 로그」를 갱신하세요.**

## 새 세션에서 이어받는 방법

1. 이 문서를 처음부터 끝까지 읽는다.
2. 「진행 로그」에서 마지막 완료 지점을 확인한다.
3. 「미결 결정」에 답이 필요한 항목이 있으면 사용자에게 먼저 묻는다.
4. 다음 미완료 Phase의 체크리스트를 순서대로 수행한다.

---

## 1. 배경

도서 데이터 공급처가 2년 사이 두 번 끊겼습니다.

- 네이버 책 검색 API 종료 → 알라딘으로 이전
- 알라딘 Open API 종료 → **현재 대응 중**

이제 사기업 API를 런타임 경로에 두지 않는 구조로 바꿉니다. 카카오로 갈아타는
것은 같은 사고를 세 번째로 반복하는 것이므로 주 공급처로 쓰지 않습니다.

### 알라딘 종료 일정 (확정)

출처: [알라딘 OpenAPI 서비스 종료 안내](https://blog.aladin.co.kr/cscenter/17483675)

| 항목 | 날짜 |
| --- | --- |
| 신규 인증키 발급 종료 | 2026-09-04 (경과) |
| **서비스 종료** | **2026-10-30** |

공지에서 확인한 사실:

- 종료 대상은 "도서 검색 및 도서정보 API 전체"
- **표지 이미지 URL(`image.aladin.co.kr`) 계속 사용 여부에 대한 언급이 없음**
- 기존 수신 데이터 재사용 가능 여부에 대한 언급도 없음
- 대체 수단 안내 없음

> 신규 키 발급이 이미 끝났으므로 **지금 `ALADIN_TTB_KEY`에 들어 있는 키가
> 마지막 키입니다.** 폐기하거나 잃어버리면 재발급받을 방법이 없습니다.
> Phase 0을 마치기 전까지 이 값을 건드리지 마세요.

### 핵심 판단

알라딘은 성격이 다른 세 가지 역할을 겸하고 있고, 각각 답이 다릅니다.

| 역할 | 현재 | 위험도 | 대응 |
| --- | --- | --- | --- |
| ① 표지 이미지 CDN | `books.image` = 알라딘 URL (약 6만 행) | 치명적 | 자체 호스팅 (대안 없음) |
| ② 서지 데이터 소스 | `resolveBook()` 신규 ISBN 유입 | 낮음 | 국립중앙도서관 ISBN API |
| ③ 실시간 검색 백엔드 | `/book/external/*` | 중간 | 자체 DB 우선 + 공공 API 폴백 |

②는 이미 6만 건이 DB에 스냅샷으로 적재돼 있어 알라딘이 죽어도 기존 도서는
멀쩡합니다. 아픈 곳은 신규 ISBN 유입 경로 하나뿐입니다.

①에는 "다른 API로 교체"라는 선택지가 없습니다. 카카오로 가면 `img1.kakaocdn.net`에,
정보나루로 가면 또 다른 남의 도메인에 6만 행을 묶는 것이라 문제가 그대로
반복됩니다.

### 데드라인의 성격 구분 (중요)

| 구분 | 해당 | 놓쳤을 때 |
| --- | --- | --- |
| **비가역 데드라인** | Phase 0 (표지 원본 확보) | **영구 손실.** cover500 화질 국내 도서 표지 6만 장을 다시 구할 방법이 없음 |
| 가역 데드라인 | Phase 1, 2 | 장애는 나지만 원본만 있으면 몇 시간 내 복구 가능 |

그래서 **Phase 0이 무조건 최우선**입니다. Phase 0만 끝나면 나머지는 사고가
나도 되돌릴 수 있습니다.

---

## 2. 확정된 결정

논의로 이미 정해진 사항입니다. 다시 논쟁하지 마세요.

1. **표지는 자체 호스팅한다.** 다른 사기업 CDN으로 갈아타지 않는다.
2. **DB에는 벤더 도메인 URL을 저장하지 않는다.** `books.image`에는 항상 자사
   도메인 URL을 넣고, 실제 스토리지는 그 뒤에서 교체 가능하게 둔다.
   이번 사고의 근본 원인이 "남의 도메인이 6만 행에 문자열로 박혀 있던 것"이다.
3. **외부 도서 API 호출은 서버로 일원화한다.** 현재 웹에서 알라딘을 직접
   호출하는 2곳을 없앤다.
4. **주 서지 공급처는 국립중앙도서관 ISBN 서지정보 API로 한다.**
5. **카카오는 폴백으로만 쓴다.** 단독 의존 금지.
6. **표지 원본 확보와 DB 컷오버를 분리한다.** 원본만 먼저 확보해 두고
   가공·도메인·컷오버는 시간을 두고 결정한다.

## 3. 미결 결정

작업 중 답이 필요해지는 시점에 사용자에게 확인하세요.

| # | 항목 | 필요 시점 | 비고 |
| --- | --- | --- | --- |
| D1 | 최종 스토리지 (Vercel Blob / Cloudflare R2 / 기타) | Phase 2 | Phase 0에는 영향 없음. 표지는 egress가 큰 자산이라 장기적으로 R2가 유리하나, 이미 Blob이 붙어 있어 속도 면에서는 Blob이 유리 |
| D2 | 표지용 자사 도메인 (`cdn.<도메인>` vs `/api/cover/...` 프록시) | Phase 2 | D1과 함께 결정 |
| D3 | 표지 가공 스펙 (WebP 품질/크기, 썸네일 단수) | Phase 2 | 원본을 보관하므로 언제든 재가공 가능 |
| D4 | `description` 품질 저하 대응 | Phase 1 | 국중 API는 책소개를 본문이 아니라 URL로 제공. ⓐ URL 추가 fetch ⓑ 기존 Gemini로 보강 ⓒ 신규 도서는 소개 없이 감수 |
| D5 | 도서관 정보나루 도입 여부 | Phase 3 이후 | 표지 소스로는 부적합. 대출 통계는 `findPopularBooks()` 보강에 유용 |
| D6 | `books.imageSourceUrl` 컬럼 추가 여부 | Phase 2 | 추가 권장. 롤백이 SQL 한 줄이 됨. 단 운영 DDL 수동 적용 대상 |
| D7 | 국중 `TITLE_URL` 화질이 쓸 만한가 | Phase 1 실측 | 신규 도서 표지의 상한을 결정. 불충분하면 카카오 thumbnail 폴백 검토 (7-b 참조) |

---

## 4. 알라딘 결합 지점 전수 조사

Phase 4에서 이 목록이 전부 정리되면 작업 완료입니다.

### 서버

- `apps/server/src/features/book/services/aladin-book-search.service.ts` — 전체 (6개 메서드: `search`, `searchDetail`, `searchFormatted`, `searchDetailFormatted`, `searchRaw`, `searchDetailRaw`)
- `apps/server/src/features/book/services/book.service.ts:47` — `resolveBook()`의 외부 조회 (ItemLookUp → ItemSearch 폴백)
- `apps/server/src/features/book/controllers/book.controller.ts:76,116` — `GET /book/external/list`, `GET /book/external/detail`
- `apps/server/src/features/book/book.module.ts` — provider 등록

### 웹 (서버 일원화 대상)

- `apps/web/src/app/api/book-list/route.ts:29` — 알라딘 직접 호출
- `apps/web/src/features/book/apis/server.ts:55,132` — 알라딘 직접 호출

### 공유 패키지

- `packages/core/src/shared/utils/cover-image.ts` — `formatAladinCoverImage`, `extractAladinDetailedDescription`
- `packages/core/src/features/book/types.ts` — 알라딘 응답 타입
- `packages/api-client/src/features/book/apis.ts`
- `packages/react-query/src/features/book/queries.ts`

### 프론트 표시

- `apps/web/src/features/book/components/common/book-card.tsx:74` — 렌더 시점에 `formatAladinCoverImage` 호출
- `apps/web/src/features/book/components/book-detail/book-description.tsx:28,33` — 알라딘 출처 표기
- `apps/web/src/features/book/components/book-detail/book-actions.tsx:46` — 알라딘 구매 링크
- `apps/web/next.config.ts:56-63` — `remotePatterns`의 `image.aladin.co.kr`

### 데이터

- `books.image` — 약 6만 행 전부 `image.aladin.co.kr`
- `books.discount` — 알라딘 판매가. 종료 후 갱신 불가. 국중 `PRE_PRICE`(정가)로
  의미를 바꾸는 편이 중고 거래 기준가로는 오히려 적절

---

## 5. Phase 0 — 표지 원본 확보 (비가역 · 최우선)

**목표: 2026-09월 중 완료. 절대 사수선 2026-10-30.**

DB를 건드리지 않는 순수 수집 단계입니다. 이 단계가 끝나면 알라딘이 언제
죽어도 영구 손실은 없습니다.

### 원칙

- **원본을 무가공으로 보관한다.** WebP 변환·리사이즈는 Phase 2에서 한다.
  가공 파라미터는 나중에 바꾸고 싶어질 수 있지만, 원본이 없으면 다시 못 구한다.
  한 번뿐인 기회에는 최대한 손실 없는 형태로 확보한다.
- **DB를 수정하지 않는다.** 실패해도 운영에 영향이 없어야 한다.
- **매니페스트를 남긴다.** 이후 모든 단계가 이 파일을 입력으로 쓴다.

### 체크리스트

- [ ] `ALADIN_TTB_KEY` 현재 값을 안전한 곳에 별도 백업 (재발급 불가)
- [x] 실태 조사 스크립트 작성 — `apps/server/scripts/survey-book-covers.ts` (읽기 전용)
- [x] **운영 DB에 실태 조사 실행** (2026-09-05 완료 — 아래 「Phase 0 조사 결과」)

  ```bash
  SURVEY_DATABASE_URL='<운영 접속 문자열>' \
    pnpm --filter @bookjeok/server exec ts-node scripts/survey-book-covers.ts
  ```

  호스트 분포, `cover500` 외 경로 비율, 빈 문자열/NULL, URL 중복도, ISBN 길이
  분포를 뽑아 `cover-survey-report.json`으로 남깁니다. 트랜잭션을 READ ONLY로
  열어 쓰기를 DB 수준에서 차단하며, 구간별로 실패를 격리하므로 쿼리 하나가
  깨져도 나머지 결과는 남습니다.
- [x] 조사 결과 기록 (아래 「Phase 0 조사 결과」)
- [x] `cover500`보다 큰 변형 탐색 — **없음. cover500이 상한** (실측 확인)
- [x] 운영 DB에서 수집 대상 목록 export — `apps/server/scripts/export-cover-targets.ts`
      → 56,656건 (`covers-manifest-input.jsonl`). 정규화 15,293 / 이미 cover500 41,363
- [x] 수집 스크립트 작성 — `apps/server/scripts/fetch-cover-originals.ts`
      (파이썬 대신 Node로 갔습니다. 이 맥에 `aiohttp`·`Pillow`가 없고 Node 24의
      내장 `fetch`로 의존성 없이 되기 때문입니다. Phase 2의 WebP 변환에는
      이미지 라이브러리가 필요하니 그때 다시 판단합니다.)
  - [x] **URL을 `cover500`으로 정규화한 뒤 요청** — 프론트와 같은 `formatAladinCoverImage()` 사용
  - [x] Cloudinary 1,249건과 `noimg_b.gif` 471건은 대상에서 제외
  - [x] 동시 6 / 초당 6 (시범 실행에서 실패 0건 확인 후 결정)
  - [x] 재시도: 지수 백오프, 최대 3회. 429/5xx는 더 길게 대기
  - [x] 이어받기 가능 — 매니페스트의 성공 ISBN을 건너뜀. SIGINT도 안전하게 처리
  - [x] 건별 매니페스트 기록 (+ `requestedUrl`, `usedFallback`, `attempts`)
- [x] 시범 실행 검증 — 일반 50건 + **cover200 전용 40건** 모두 성공, 전부 500px 폭 수신 확인
- [x] **전량 실행 완료** (56,656건 / 157.9분 / 초당 6.0건)
- [x] 실패분 재시도 — 5건 중 1건 회수(일시적 오류), 4건은 영구 404
- [x] 검증 완료 (아래 「수집 결과」)
  - [x] 성공률 집계, 실패 사유별 분류
  - [x] 손상 파일 검출 — 0바이트 0건, 크기 불일치 0건, 파일 누락 0건
  - [x] 의심 항목 육안 확인 — 소용량 5건·중복 해시 모두 정상으로 판명
- [ ] 매니페스트 + 원본을 **두 곳 이상**에 보관
- [x] 진행 로그에 결과 기록

### Phase 0 조사 결과 (2026-09-05 실측)

`apps/server/scripts/survey-book-covers.ts` 실행 결과. 8구간 전부 성공.
원본 리포트는 `apps/server/cover-survey-report.json`.

| 항목 | 값 |
| --- | --- |
| 전체 도서 수 | **58,376** |
| 표지 URL 결측 | **0건** (NULL·빈 문자열 모두 없음) |
| 표지 호스트 | `image.aladin.co.kr` 57,127 / `res.cloudinary.com` 1,249 |
| 스킴 | 전부 `https` (http 승격 불필요) |
| 커버 경로 | `cover500` 41,363 / **`cover200` 15,293** / `covers`(Cloudinary) 1,249 / 패턴 없음 471 |
| 확장자 | jpg 57,265 / gif 1,048 / png 63 |
| 고유 URL 수 | 57,905 |
| 표지 없음 플레이스홀더 | **471건** — 전부 `noimg_b.gif` 한 URL 공유 |
| ISBN 길이 | 13자리 58,184 / **10자리 192** |
| 설명 결측 | 852건 |
| 가격 결측 | 580건 |

#### 수집 대상 산정

```
전체                        58,376
- Cloudinary (이미 자체 자산)  -1,249
- noimg 플레이스홀더            -471
────────────────────────────────────
실제 수집 대상               56,656   (= cover500 41,363 + cover200 15,293)
```

추정 용량: cover500 실측 55~115KB → 평균 70KB 가정 시 약 4GB (실제 4.47GB).

#### 수집 결과 (2026-09-05 완료)

| 항목 | 값 |
| --- | --- |
| **성공 / 실패** | **56,652 / 4** (99.993%) |
| **총 용량** | **4.47GB** (평균 84,701B / 중앙값 78,568B / 최대 1,019,863B) |
| 소요 시간 | 157.9분 (초당 6.0건) |
| 확장자 | jpg 56,644 / png 6 / gif 2 |
| 폴백 사용 | **0건** — 요청한 `cover500`이 전부 존재 |
| 무결성 | 0바이트 0 · 크기 불일치 0 · 파일 누락 0 |
| 저장 위치 | `apps/server/cover-originals/` (ISBN 끝 2자리 100개 샤드) |

**수집 실패 4건 (영구 손실 · 복구 불가).** `cover500`·`cover200` 모두 404로,
알라딘 CDN에서 원본이 사라진 건입니다. Phase 1에서 국중 `TITLE_URL`로 채울
후보입니다.

| ISBN / 코드 | 비고 |
| --- | --- |
| `9791158911454` | 파일명에 `+` 포함 |
| `K302130847` · `K592032925` · `K692837506` | 알라딘 내부 코드(`scm*` 이미지) |

**검증에서 정상으로 판명된 의심 항목**

- **3KB 미만 5건** — 플레이스홀더가 아니라 알라딘 원본 자체가 저해상도인 책
  (150x241, 102x150 등). `cover500`으로 요청해도 원본 이상은 나오지 않습니다.
- **동일 해시 160종 349건** — 시리즈·전집이 같은 표지를 쓰는 정상 케이스.
  최다 그룹 9건은 ISBN이 연속(`9788991931015`~`...091`)인 한 세트입니다.

#### ⚠ 반드시 반영할 발견 3가지

**1. `cover200` 15,293건(26%)을 DB 값 그대로 받으면 안 된다.**

현재 프론트가 렌더 시점에 `formatAladinCoverImage()`로 `cover200` → `cover500`
치환을 하고 있습니다(`book-card.tsx:74`). 그래서 DB에 저화질 URL이 들어 있어도
화면에는 고화질로 나옵니다. **DB 값을 그대로 수집하면 지금 서비스보다 화질이
떨어진 채로 영구 고착됩니다.** Phase 4에서 그 함수를 지우고 나면 되돌릴 수도
없습니다.

실측으로 치환이 동작함을 확인했습니다:

| 경로 | 크기 |
| --- | --- |
| `.../cover200/k472737159_1.jpg` | 17,259 B |
| `.../cover500/k472737159_1.jpg` | 55,137 B (3.2배) |

→ **수집 스크립트는 URL을 `cover500`으로 정규화한 뒤 내려받아야 한다.**

**2. `cover500`이 알라딘의 최대 해상도다.** 더 큰 변형을 찾아봤으나 전부 404:

| 시도 | 결과 |
| --- | --- |
| `cover500` | 200 (114,922 B) |
| `cover1000` · `cover1500` · `covermax` · `coverbig` · `cover800` | 404 |
| `cover` | 200 (18,662 B — 오히려 작음) |

→ 계획서의 "더 큰 변형 탐색" 항목은 이것으로 종결. `cover500`이 상한.

**3. 10자리 `isbn` 192건은 실제 ISBN이 아니다.** `5000004597`, `5000051472` 같은
알라딘 내부 상품코드입니다. **국중 API로 조회가 불가능하므로** Phase 1에서 별도
처리 대상으로 분류해야 합니다.

### 주의

- 표지 이미지 재호스팅은 저작권상 회색지대입니다(권리자는 출판사). 국내
  독서·중고서점 서비스에서 널리 이뤄지는 관행이고 실질 리스크는 낮다고
  판단했으나, 알고 진행하는 것으로 합의된 사항입니다.
- 표지가 없는 도서(빈 `image`)는 이 단계에서 채우려 하지 마세요. Phase 1에서
  국중 `TITLE_URL`로 별도 처리합니다.

---

## 6. Phase 1 — Provider 추상화 · 서버 일원화 · 국중 어댑터

**목표: 알라딘이 끊겨도 검색과 신규 도서 등록이 살아 있을 것. 2026-10-30 이전 배포.**

알라딘이 끊기면 `/book/external/list`, `/book/external/detail`, `resolveBook()`이
모두 500을 뱉습니다. 심각도가 표지보다 높습니다(표지는 깨진 이미지로 끝나지만
이쪽은 기능 자체가 죽음).

### 무엇을 무엇으로 대체하는가 (혼동 방지)

알라딘은 세 가지 역할을 겸했고, **역할마다 대체 수단이 다릅니다.**

| 알라딘의 역할 | 대체 수단 | 상태 |
| --- | --- | --- |
| ① 표지 이미지 CDN | **자체 호스팅** | ✅ 완료 — 국중과 무관 |
| ② 서지 데이터(ISBN→책 정보) | 국립중앙도서관 | 인증키 대기 |
| ③ 검색(키워드→책 목록) | 국립중앙도서관 | 인증키 대기 |

**①은 국중이 대체하는 것이 아닙니다.** Phase 0에서 이미 끝났습니다. 국중이
맡을 범위는 ②③뿐입니다.

#### 필드 단위 대응표

| `books` 필드 | 알라딘 | 국중 | 판정 |
| --- | --- | --- | --- |
| `isbn` | `isbn13` | `EA_ISBN` | 대체 가능 |
| `title` | `title` | 본표제 | 대체 가능 |
| `author` | `author` | 저자 | 대체 가능 |
| `publisher` | `publisher` | 발행처 | 대체 가능 |
| `image` | `cover` | `TITLE_URL` | 있으나 **자체 확보분을 쓰므로 불필요** |
| `discount` | 판매가 | `PRE_PRICE`(정가) | **의미가 다름** — 중고 기준가로는 정가가 오히려 적절 |
| `description` | 본문 | `BOOK_INTRODUCTION_URL` | **본문이 아니라 URL** → 미결 D4 |
| `link` | 상품 페이지 | 없음 | **대응물 없음** — `BookInfo.link` 옵셔널화로 대응 완료 |
| 검색 | 키워드 | 제목·저자·발행처·ISBN | 대체 가능 |

#### 국중으로 해결되지 않는 것

1. **책소개 본문** — URL만 제공. 별도 fetch 필요 (미결 D4).
2. **구매 링크** — 대응물 없음. `BookActions`가 이미 `link` 부재를 처리하므로
   버튼이 사라질 뿐 장애는 없습니다.
3. **알라딘 내부 코드 192건** — `5000051472` 같은 10자리 값은 ISBN이 아니라
   알라딘 상품코드라 **국중 조회가 원천적으로 불가능**합니다.
4. **검색 정확도 정렬** — 알라딘의 `Accuracy` 같은 개념이 약합니다. 실사용에서
   얼마나 아픈지는 실측 전까지 알 수 없습니다.

#### 카카오의 위치

**카카오는 예정된 작업이 아닙니다.** 구현된 것이 없고 공급처 체인에도 없습니다.

위 4번(검색 품질)이 실사용에 못 미칠 때 꺼내는 **조건부 카드**이며, 그 판단은
국중 커버리지 실측 이후에 합니다. 실측 결과가 쓸 만하면 카카오는 도입하지
않습니다. 「확정된 결정」 5번은 "카카오를 쓴다"가 아니라 **"쓰더라도 주 공급처로는
쓰지 않는다"** 는 제약입니다.

#### 아직 모르는 것

기능 자체가 국중으로 된다는 것은 확실합니다. **커버리지와 검색 품질은
실측 전까지 알 수 없습니다.** 인증키 도착 후 첫 작업이 이 실측이며, 결과에 따라
D4와 카카오 도입 여부가 갈립니다.

### 국립중앙도서관 ISBN 서지정보 API

출처: [사양](https://www.nl.go.kr/NL/contents/N31101030500.do) · [공공데이터포털](https://www.data.go.kr/data/3078982/openapi.do)

```
GET https://www.nl.go.kr/seoji/SearchApi.do
  cert_key      인증키 (필수)
  result_style  json | xml (필수)
  page_no       1부터 (필수)
  page_size     쪽당 건수 (필수)
```

검색 조건: 제목(본표제), 저자, 발행처, ISBN/세트ISBN, 발행예정일, 납본유무 등

활용할 응답 필드:

| 필드 | 매핑 |
| --- | --- |
| `TITLE_URL` | 표지 이미지 URL |
| `PRE_PRICE` | 예정가격 → `books.discount` |
| `BOOK_INTRODUCTION_URL` | 책소개 (본문이 아니라 **URL**) |
| `BOOK_TB_CNT_URL` | 목차 (URL) |
| `BOOK_SUMMARY_URL` | 책요약 (URL) |

장점: 무료, 폐업 리스크 없음, ISBN 발급 시점 등록이라 **신간 커버리지가 상용
API보다 오히려 빠름**.

약점(정직하게): 책소개가 URL이라 별도 fetch 필요(→ D4), 검색 정확도 정렬이
상용만 못함, `TITLE_URL` 화질이 `cover500`에 못 미칠 수 있음. 일일 호출 제한은
문서에 명시가 없어 **실측으로 확인 필요**.

### 설계

```
BookCatalogProvider (포트)
  ├─ search(query, opts): BookSummary[]
  └─ findByIsbn(isbn): BookDetail | null

어댑터 체이닝: LocalDb → NationalLibrary → (Kakao, 폴백)
```

- 컨트롤러·서비스는 포트에만 의존한다. 다음번에 또 공급처가 바뀌어도 어댑터
  하나만 추가하면 되도록 한다.
- 응답 정규화 타입은 `packages/core`에 둔다 (Contract-First: `.agents/rules/01-monorepo-packages.md`).

### 체크리스트

- [ ] 국중 API 인증키 발급 — **국립중앙도서관 자체 사이트**에서 신청
      (도서관 서비스 > Open API > 인증키 신청/관리, `/NL/contents/N31101020000.do`).
      공공데이터포털이 아니라 국중 사이트입니다. **담당자 승인 단계가 있어
      즉시 발급이 아니므로 미리 신청해 둘 것.** 문의: 디지털정보기획과 02-590-0548
- [ ] 실호출로 응답 형태·필드 존재율·호출 제한 실측 (샘플 50 ISBN)
  - [ ] 우리 DB 상위 인기 도서 ISBN으로 커버리지 확인 — 이게 실사용 품질의 지표
- [x] 정규화 타입 정리 — 기존 `BookInfo`를 표준으로 확정 (`link`·`pubdate` 옵셔널화, `BookSearchField` 중립화)
- [x] `BookCatalogProvider` 포트 정의 — `providers/book-catalog.types.ts`
- [ ] `NationalLibraryBookProvider` 어댑터 구현 ← **인증키 도착 후 남은 유일한 작업**
- [x] `LocalDbBookCatalogProvider` 구현 — 체인 마지막(최후 방어선)에 배치
- [x] 체이닝 오케스트레이터 구현 — `BookCatalogService`. 순서는 `book.module.ts` 한 곳에서 결정
  - [x] 알라딘 어댑터(`AladinBookCatalogProvider`)로 기존 동작 보존
- [x] `resolveBook()`을 포트 의존으로 교체
- [x] `/book/external/list`, `/book/external/detail`을 포트 의존으로 교체
- [x] **웹 직접 호출 제거 완료** (2026-09-05)
  - [x] `apps/web/src/features/book/apis/server.ts` — 백엔드 `/book/external/*` 경유로 전환.
        인메모리·React 캐시와 "items 부재는 장애" 방어 로직은 그대로 유지
  - [x] `apps/web/src/app/api/book-list/route.ts` — 백엔드 프록시로 전환.
        앱 내부 호출처가 없어 삭제 후보이나 외부 클라이언트 호환을 위해 남김
  - [x] 벤더 타입 격리 — `AladinBookItem`·`AladinSearchResponse`를 `packages/core`에서
        제거해 서버 어댑터 안으로 한정. `AladinQueryType` → **`BookSearchField`**로 중립화
  - [x] `BookInfo.link`·`pubdate` 옵셔널화 — 국중은 `link` 대응물이 없음
        (`BookActions`는 이미 옵셔널 처리돼 UI 변경 없음)
  - [x] 죽은 코드 제거 — `searchRaw()`/`searchDetailRaw()` (호출처 없음)
  - [x] 웹 env에서 `ALADIN_TTB_KEY` 제거 (웹은 더 이상 공급처를 부르지 않음)
  - [x] 검증 — 타입체크(core·server·web) / 테스트 서버 198 + 웹 239 / 린트 9개 전부 통과
- [ ] `KakaoBookProvider` (선택, 폴백용)
- [ ] 환경변수 등록: `NL_SEOJI_CERT_KEY` (+ 카카오 검색 시 REST 키.
      기존 `KAKAO_CLIENT_ID`는 **로그인용이라 다름**)
  - [ ] `.env.example`
  - [ ] `turbo.json`의 `globalEnv` — 빠뜨리면 Turbo 캐시가 값 변경을 감지 못함
- [x] 테스트 — 기존 spec 2개를 포트 기준으로 갱신 + `book-catalog.service.spec.ts` 신규 7건 (체인 폴백·전체 실패·빈 결과 구분)
- [x] `apps/server/src/features/book/README.md` 갱신
- [ ] 알라딘 어댑터는 이 시점에 **삭제하지 말고** 폴백으로 남겨둔다 (10/30까지 유효)

---

## 7. Phase 2 — 표지 파이프라인 · 자체 도메인 · DB 컷오버

**데드라인 없음(가역). 다만 알라딘 CDN 수명이 불확실하므로 10/30 이전 권장.**

미결 D1·D2·D3을 먼저 확정해야 시작할 수 있습니다.

### 체크리스트

- [ ] D1·D2·D3 확정
- [ ] Phase 0 원본에서 가공: WebP 500px(상세) + 200px(목록/카드) 생성
- [ ] 자사 도메인 배치 — `books.image`에 들어갈 형태 확정
      (예: `https://cdn.<도메인>/covers/{isbn}.webp`)
- [ ] 표지 없는 도서 처리: 국중 `TITLE_URL`로 보완 → 그래도 없으면 플레이스홀더
- [ ] (D6 채택 시) `books.imageSourceUrl` 컬럼 추가
  - [ ] `apps/server/scripts/derive-ddl.ts`로 DDL 도출 (손으로 쓰지 말 것)
  - [ ] 운영 적용 후 **`docs/manual-ddl-log.md`에 반드시 기록**
- [ ] 컷오버 배치 스크립트 작성 (배치 단위 UPDATE, 진행률 로그, 중단·재개 가능)
- [ ] `next.config.ts`의 `remotePatterns`에 새 CDN 호스트 **먼저** 추가 후 배포
      (순서 주의: 호스트 등록 전에 DB를 바꾸면 next/image가 전부 깨짐)
- [ ] 소량(100건) 선행 컷오버 → 웹에서 육안 확인
- [ ] 전량 컷오버
- [ ] 검증: 랜덤 표본 렌더링 확인, 404 모니터링, `image` 컬럼에 알라딘 호스트
      잔존 0건 확인
- [ ] 롤백 절차 문서화 (컬럼 채택 시 `UPDATE books SET image = "imageSourceUrl"`,
      아니면 매니페스트 기반 복원 스크립트)

---

## 7-b. 신규 도서 표지 상시 파이프라인 (Phase 2와 함께)

**Phase 0·2는 기존 56,656건만 해결합니다.** 앞으로 들어올 책의 표지를 어떻게
확보할지는 별도 설계가 필요하며, 이것을 빼먹으면 같은 사고가 반복됩니다.

### 왜 급한가 — 실측 (2026-09-05)

| 구간 | 신규 도서 |
| --- | --- |
| 최근 7일 | **830건** (하루 약 118건) |
| 최근 30일 | 5,200건 |
| 2026-07 | 44,983건 (대량 적재로 추정) |

벌크 적재를 빼도 **하루 100건 이상** 유입됩니다. 1년이면 약 4만 건으로 현재
DB의 70% 규모입니다.

### 문제

현재 `resolveBook()`은 공급처가 준 표지 URL을 그대로 `books.image`에 넣습니다.
이 흐름이 남으면 **국중 URL이 하루 100건씩 쌓입니다.** Phase 2에서 기존 6만 건을
자체 도메인으로 바꿔놔도 구멍이 계속 새는 셈이고, 국중이 언젠가 바뀌면 지금 겪는
일을 처음부터 다시 겪습니다.

「확정된 결정」 2번(**DB에는 자체 도메인 URL만**)은 일회성 마이그레이션 규칙이
아니라 **상시 규칙**이어야 합니다.

### 설계

```
새 ISBN → 공급처 조회 (서지 + 표지 URL)
       → books insert (image = 플레이스홀더)
       → [비동기 이벤트] 표지 다운로드 → 자체 스토리지 → books.image 갱신
```

비동기여야 하는 이유: `resolveBook()`은 판매글·리뷰 작성이 타는 경로입니다.
여기서 외부 이미지 서버를 동기로 기다리면 등록이 느려지고, 그 서버가 죽으면
등록 자체가 실패합니다.

레포에 이미 `@nestjs/event-emitter` 기반 리스너 패턴이 있습니다
(`order`·`trade`·`chat`·`llm`). 같은 방식으로 붙입니다.

### 체크리스트

- [ ] 표지 수집 이벤트/리스너 추가 (`book.cover_needed` 등)
- [ ] `resolveBook()`에서 신규 도서 생성 시 이벤트 발행
- [ ] 표지 확보 실패 시 재시도 정책 (영구 실패는 플레이스홀더로 확정)
- [ ] 플레이스홀더 이미지 준비 — 기존 `noimg` 471건도 같은 것으로 통일
- [ ] Phase 2의 일회성 수집 코드와 로직 공유 (URL → 스토리지 → DB 갱신)

### 감수할 손실

알라딘 `cover500`은 종료 후 얻을 수 없습니다. **국중 `TITLE_URL`의 화질이 곧
신규 도서 표지의 상한**이며, 그 화질이 어느 정도인지는 인증키 도착 후에야
측정할 수 있습니다(`cover.nl.go.kr` 호스트 존재는 확인, URL 패턴·해상도는 미확인).

기존 56,656건은 고화질로 확보했으므로 **서비스의 대부분은 안전하고, 신규 유입분만
화질이 떨어질 수 있습니다.** 국중 화질이 쓸 수 없는 수준이면 그때 카카오
thumbnail을 표지 폴백으로 검토합니다(실측 후 판단).

## 8. Phase 3 — 자체 검색 강화

외부 API 호출을 전체 트래픽의 몇 %로 떨어뜨리는 단계입니다.

현재 `BookService.searchBooks()`가 `title LIKE :query OR author LIKE :query`
(`%query%`)라 6만 행 풀스캔입니다. 인덱스가 안 먹는 형태입니다.

### 체크리스트

- [x] Supabase 확장 가용성 조사 완료 (2026-09-05, PostgreSQL 17.6)

      | 확장 | 상태 | 판단 |
      | --- | --- | --- |
      | `pgroonga` 3.2.5 | 사용 가능 (미설치) | **1순위.** Groonga 기반 전문검색으로 한글에 강함 |
      | `pg_trgm` 1.6 | **이미 설치됨** | 2순위. 즉시 쓸 수 있으나 3-gram이라 한글 품질은 아쉬움 |
      | `pg_bigm` | **없음** | 계획 당시 1순위였으나 Supabase 미제공 |
      | `vector` 0.8.0 | 설치됨 | 기존 AI 검색용 |

      → `pg_bigm`은 탈락. **`pgroonga`를 우선 검토**하고, 도입 부담이 크면 이미
      깔려 있는 `pg_trgm`으로 간다.

- [x] `books` 인덱스 현황 확인 — **PK(`isbn`) 하나뿐.** `title`/`author`
      인덱스가 없어 현재 `searchBooks()`의 `LIKE '%query%'`는 58,376행 풀스캔이
      확정적이다.
- [ ] `title`, `author`에 GIN 인덱스 설계
- [ ] DDL은 `derive-ddl.ts`로 도출 → 적용 → `docs/manual-ddl-log.md` 기록
- [ ] `searchBooks()` 재작성 + 전후 실행계획/응답시간 비교
- [ ] 검색 파이프라인 순서 조정: **자체 DB 1차 → 미스일 때만 외부 API**
- [ ] (선택, D5) 정보나루 대출 통계로 `findPopularBooks()` 보강

---

## 8-b. 작업 산출물 정리 (마이그레이션 완료 후 필수)

이 작업으로 생긴 일회성 스크립트와 임시 산출물입니다. **Phase 2 컷오버가
끝나고 안정화되면 정리하세요.** 사용자가 명시적으로 요청한 항목입니다.

### 반드시 삭제

| 대상 | 이유 |
| --- | --- |
| `apps/server/.env.prod.local` | **운영 DB 자격증명.** 최우선 삭제 |
| Supabase DB 비밀번호 로테이션 | 작업 중 평문으로 오갔음 |

### 산출물 (Phase 2 업로드 완료 후)

| 대상 | 처리 |
| --- | --- |
| `apps/server/cover-originals/` (5~6GB) | 스토리지 업로드·검증 후 아카이브 또는 삭제 |
| `apps/server/covers-manifest-input.jsonl` | 삭제 |
| `apps/server/cover-fetch.log` | 삭제 |
| `apps/server/cover-survey-report.json` | 수치는 이 문서에 남아 있으므로 삭제 가능 |
| `.gitignore`의 표지 마이그레이션 블록 | 산출물 삭제 후 함께 제거 |

### 일회성 스크립트

| 스크립트 | 판단 |
| --- | --- |
| `scripts/export-cover-targets.ts` | 삭제 — 알라딘 종료 후 재사용 불가 |
| `scripts/fetch-cover-originals.ts` | 삭제 — 알라딘 종료 후 재사용 불가 |
| `scripts/survey-book-covers.ts` | **컷오버 검증까지 유지 후 삭제.** `books.image` 호스트 분포를 다시 찍어 알라딘 잔존 0건을 확인하는 데 쓰입니다 |

## 9. Phase 4 — 알라딘 잔재 정리

**2026-10-30 이후 착수.** 그 전까지 알라딘은 유효한 폴백이므로 성급히 지우지 마세요.

- [ ] `aladin-book-search.service.ts` 삭제
- [ ] `packages/core`의 `formatAladinCoverImage`, `extractAladinDetailedDescription` 정리
      (`book-card.tsx:74`가 렌더 시점에 호출 중 — 제거 시 호출부 동시 수정)
- [ ] 알라딘 응답 타입 정리 (`packages/core/src/features/book/types.ts`)
- [ ] `next.config.ts`에서 `image.aladin.co.kr` 제거
- [ ] 구매 링크/출처 표기 교체 (`book-actions.tsx:46`, `book-description.tsx:28,33`)
      — i18n 키 `aladin_buy_link`, `aladin_source_credit`도 함께
- [ ] `ALADIN_TTB_KEY` 제거 (`.env.example`, `turbo.json` `globalEnv`, 운영 환경변수)
- [ ] `apps/server/src/features/book/README.md` 최종 갱신
- [ ] 루트 `README.md` 환경변수 문서 갱신

---

## 10. 진행 로그

작업을 마칠 때마다 한 줄씩 추가하세요. 다음 세션이 여기부터 읽습니다.

| 날짜 | Phase | 내용 | 결과 |
| --- | --- | --- | --- |
| 2026-09-05 | — | 결합 지점 전수 조사, 종료 일정·국중 API 사양 확인, 본 계획 수립 | 문서 작성 |
| 2026-09-05 | 0 | 실태 조사 스크립트 `apps/server/scripts/survey-book-covers.ts` 작성 | 타입체크·포맷 통과. 운영 실행 대기 |
| 2026-09-05 | 0 | 운영 DB 실태 조사 실행 (Supabase 풀러 경유 — 직접 연결은 IPv6 전용이라 불가) | 58,376건. 수집 대상 56,656건 확정 |
| 2026-09-05 | 0 | 커버 해상도 변형 실측 | `cover200` 26%는 반드시 `cover500`으로 정규화 필요. `cover500`이 상한 |
| 2026-09-05 | 0 | 대상 추출·수집 스크립트 작성, 시범 실행 검증 | cover200 40건 전부 500px 수신 확인 |
| 2026-09-05 | 0 | **표지 원본 전량 수집 완료** (56,656건) | 56,652 성공 / 4 영구404, 4.47GB, 무결성 이상 없음 |
| 2026-09-05 | 1 | **서버 일원화 완료** — 웹의 공급처 직접 호출 2곳 제거, 벤더 타입 격리 | 타입체크·테스트(437건)·린트 전부 통과 |
| 2026-09-05 | 2 | 신규 도서 유입량 실측 → 표지 상시 파이프라인 설계 누락 발견, 7-b 추가 | 하루 100건 이상 유입. Phase 2에 포함 필요 |
| 2026-09-05 | 1 | **Provider 포트·체이닝 도입** — 알라딘/자체DB 어댑터, 컨트롤러·resolveBook 전환 | 서버 테스트 205건·린트·타입체크 통과 |
| 2026-09-05 | 3(사전) | Supabase 확장 가용성 조사 | `pg_bigm` 없음, **`pgroonga` 사용 가능**, `pg_trgm` 기설치. `books` 인덱스는 PK뿐 |

