# Frontend Feature: Review

프론트엔드의 `review` 기능은 도서 리뷰 작성, 조회, 수정, 삭제 및 리액션 기능을 담당합니다. 인기 리뷰 랭킹, 카테고리별 필터링 등 다양한 기능을 제공합니다.

## 1. 주요 파일 및 역할

- **`apis.ts`**: 백엔드 `/reviews` 엔드포인트와 통신하는 API 함수들을 정의합니다.
  - `getReviews`: 리뷰 목록 조회 (필터링/페이지네이션)
  - `getReviewDetail`: 리뷰 상세 조회
  - `getPopularReviews`: 인기 리뷰 목록 조회
  - `getReviewFeeds`: 카테고리별 리뷰 피드 조회
  - `createReview`: 리뷰 작성
  - `updateReview`: 리뷰 수정
  - `deleteReview`: 리뷰 삭제
  - `toggleReaction`: 리액션 토글
  - `getMyReaction`: 내 리액션 상태 조회

- **`queries.tsx`**: TanStack Query 쿼리 훅을 정의합니다.
  - `useReviewDetailQuery`: 리뷰 상세 조회
  - `useReviewsQuery`: 리뷰 목록 조회 (단일 페이지)
  - `useReviewsInfiniteQuery`: 리뷰 목록 무한 스크롤 조회 (**커서 기반 페이지네이션**: `cursorId` 사용)
  - `usePopularReviewsQuery`: 인기 리뷰 조회
  - `useReviewFeedsQuery`: 카테고리별 피드 조회
  - `useMyReactionQuery`: 내 리액션 상태 조회

- **`mutations.tsx`**: TanStack Query 뮤테이션 훅을 정의합니다.
  - `useCreateReviewMutation`: 리뷰 작성
  - `useUpdateReviewMutation`: 리뷰 수정
  - `useDeleteReviewMutation`: 리뷰 삭제
  - `useToggleReactionMutation`: 리액션 토글 (낙관적 업데이트)

- **`components/`**: 리뷰 관련 UI 컴포넌트들
  - `review-card.tsx`: 리뷰 카드 (목록용)
  - `review-detail.tsx`: 리뷰 상세 화면
  - `review-form.tsx`: 리뷰 작성/수정 폼
  - `review-reaction-section.tsx`: 리액션 버튼 섹션
  - `review-slider.tsx`: 홈페이지 리뷰 슬라이더
  - `popular-review-list.tsx`: 인기 리뷰 랭킹 목록

- **`actions/`**: 서버 액션
  - `revalidate-action.ts`: 리뷰 관련 캐시 무효화

- **`server/`**: 서버 사이드 데이터 페칭
- **`types/`**: 리뷰 관련 TypeScript 타입 정의
- **`constants.ts`**: 리뷰 카테고리, 리액션 타입 등 상수 정의
- **`schemas.ts`**: Zod 스키마 (폼 유효성 검사)

## 2. 리뷰 작성 플로우

```mermaid
sequenceDiagram
    participant User as 사용자
    participant Form as ReviewForm
    participant Editor as Tiptap Editor
    participant Mutation as useCreateReviewMutation
    participant ServerAction as revalidate-action

    User->>Form: 리뷰 작성
    Form->>Editor: 본문 입력 (Rich Text)
    User->>Form: 제출
    Form->>Mutation: mutate(reviewData)
    Mutation->>ServerAction: revalidatePath 호출
    ServerAction->>User: 리뷰 목록으로 이동
```

## 3. 리액션 시스템

리뷰에는 다양한 리액션을 남길 수 있습니다:

- 👍 좋아요
- 💡 유익해요
- 💪 응원해요
- 😢 공감해요
- 🎉 축하해요

각 리액션은 토글 방식으로 동작하며, 낙관적 업데이트를 적용하여 빠른 UI 반응성을 제공합니다.

## 4. 인기 리뷰 선정

인기 리뷰는 다음 공식으로 계산됩니다:

- 스코어 = (조회수 × 1) + (리액션 수 × 3)

홈페이지와 리뷰 목록 페이지에서 인기 리뷰 랭킹을 확인할 수 있습니다.

## 5. Tiptap 에디터

리뷰 본문 작성에 Tiptap 에디터를 사용합니다:

- 서식 지정 (굵게, 기울임, 밑줄)
- 제목 (H1, H2, H3)
- 목록 (순서 있음/없음)
- 인용구

## 6. 비공개 리뷰 기능

리뷰 작성 시 공개/비공개 설정이 가능합니다.

### 6.1 동작 방식

| 접근자               | 응답 데이터              | UI                                     |
| -------------------- | ------------------------ | -------------------------------------- |
| 타인 (비로그인 포함) | `content` 마스킹 (빈 값) | `PrivateReviewOverlay` (자물쇠 아이콘) |
| 작성자 본인          | 전체 원본 데이터         | `ReviewDetailContent` (정상 표시)      |

### 6.2 프론트엔드 구현

- **`ReviewDetail`**: `useEffect`를 사용해 본인의 비공개 리뷰 접근 시 `getReviewAuthenticated` API를 호출하여 원본 데이터를 가져옵니다.
- **`PrivateReviewOverlay`**: 접근 권한이 없는 사용자에게 표시되는 Glassmorphism 스타일의 오버레이 컴포넌트입니다.

### 6.3 백엔드 구현

- **`ReviewService.findOne`**: 비공개 리뷰 조회 시 403 에러 대신 `content` 필드를 빈 값으로 마스킹하여 반환합니다.
- 이를 통해 SSR 메타데이터(타이틀 등)는 정상적으로 생성되면서도 본문 내용은 보호됩니다.
