# Frontend Feature: Book

프론트엔드의 `book` 기능은 도서 정보 검색, 도서 상세 정보, 인기 도서, 최근 본 책, AI 도서 요약, 인기 검색어 등 도서와 관련된 핵심 정보 제공 및 탐색 경험을 담당합니다. 중고책 판매 관련 로직은 `book-sale` 기능으로 완전 분리되었습니다.

## 1. 주요 파일 및 역할

- **`features/book/apis/`**: 백엔드 `/book`, `/llm`, `/search-keyword` 엔드포인트와 통신하는 API 함수들을 정의합니다.
  - `index.ts`: `getBookList`(검색), `getBookDetail`(상세), `recordBookView`(조회수), `getPopularBooks`(인기 도서), `getBookSummary`(AI 요약), `getPopularKeywords`(인기 검색어), `recordSearchKeyword`(검색어 기록)
  - `server.ts`: 프론트엔드 환경에서 사용할 수 있도록 래핑된 서버용 API 함수들
- **`features/book/queries/`**: `apis`의 함수를 사용하여 TanStack Query 훅을 생성합니다. 데이터 캐싱, 무한 스크롤 로직 등을 담당합니다.
  - `index.tsx`: 
    - `useBookListQuery`: 검색어 조건에 따른 단일 페이지 도서 목록 조회
    - `useBookDetailQuery`: ISBN으로 특정 책의 상세 정보를 조회
    - `useInfiniteBookSearch`: 검색어에 따라 도서 목록을 무한 스크롤로 조회
    - `usePopularBooksQuery`: 조회수 및 인기도 기반 평점이 높은 도서 목록 조회
    - `useBookSummaryQuery`: AI 도서 요약 정보 조회
    - `usePopularKeywordsQuery`: 최근 3일 기준 인기 검색어 목록 조회
  - `prefetch.ts`: 서버 컴포넌트 환경에서 React Query 캐시를 prefetch하기 위한 유틸리티 함수
- **`features/book/stores/`**: 도서 관련 클라이언트 상태를 관리하는 Zustand 스토어.
  - `useRecentBookStore`: 최근 본 책 목록을 `localStorage` 또는 `sessionStorage`에 저장하고 관리.
- **`features/book/components/`**: **Context-Based Grouping**
  - **`book-search/`**: 도서 검색 페이지 UI 및 필터
  - **`book-detail/`**: 도서 상세 정보 뷰 (정보, 평점, 요약 등)
  - **`book-slider/`**: 도서 캐루셀 슬라이더
  - **`recent-books/`**: 최근 본 책 UI
  - **`common/`**: 핵심 공통 컴포넌트 (`book-cover`, `book-item` 등)
- **`features/book/constants/`**: 디폴트 검색 조건, 정렬 기준 등 
- **`features/book/types.ts`**: 도서 응답 및 쿼리 파라미터 타입

## 2. 데이터 흐름 및 핵심 로직

### 도서 상세 조회 및 조회수 기록

사용자가 도서 상세 페이지에 접근하면 해당 도서의 정보와 요약을 가져오는 동시에, 검색 및 인기도 계산을 위한 조회수 로직을 실행합니다.

1.  **상세 페이지 접근**: 사용자가 특정 ISBN의 도서 상세 페이지로 진입
2.  **데이터 페칭**: `useBookDetailQuery`를 통해 백엔드 캐시 또는 DB에서 도서 상세 정보를 가져옴. 동시에 `useBookSummaryQuery`로 도서 요약 정보(AI 번역 제공)를 병렬 페칭 가능.
3.  **조회수 카운트**: 백그라운드에서 `recordBookView` API가 호출되며 도서 조회 빈도를 기록
4.  **최근 본 책 업데이트**: 도서 상세 정보를 `useRecentBookStore`에 전달하여 상태값 업데이트, 로컬 스토리지 등에 최신 관람 이적을 남겨 다른 페이지에서도 위젯으로 이용 가능하게 처리.

### 무한 스크롤 도서 검색 검색기

사용자가 책 검색 페이지에서 검색어를 입력하면 서버 성능을 유지하면서 스크롤에 반응해 점진적으로 탐색 환경을 만듭니다.

1.  **검색어 입력**: 검색 파라미터 업데이트와 함께 `recordSearchKeyword` API를 통해 검색어 로그 전송
2.  **무한 스크롤 훅 실행**: `useInfiniteBookSearch`가 현재 설정된 페이지(`start`)와 한 번에 가져올 수(`display`) 파라미터에 맞추어 `getBookList` 실행
3.  **다음 페이지 요청**: Intersection Observer 등을 통해 리스트의 하단을 감지하면 Tanstack Query의 `fetchNextPage` 호출, 파라미터 오프셋 값 증가와 함께 백그라운드 데이터 캐싱 후 컴포넌트에 병합.
