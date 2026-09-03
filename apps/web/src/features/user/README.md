# Frontend Feature: User (프로필 · 통계 · 위시리스트)

내 프로필 관리, 사용자 통계 대시보드, 위시리스트, 회원 탈퇴를 담당합니다.

## 1. 폴더 구조

```
user/
├── mutations/
├── __tests__/wishlist.test.tsx
└── components/
    ├── profile/
    │   ├── user-profile/             # 공개 프로필 (/users/[handle])
    │   ├── profile-edit-modal/       # 닉네임·핸들·소개·프로필 이미지 수정
    │   ├── withdrawal-modal/         # 회원 탈퇴
    │   └── profile-page-json-ld/     # ProfilePage 구조화 데이터
    ├── dashboard/
    │   └── user-stats-dashboard/ (+ skeleton)
    └── wishlist/
        ├── wishlist-button/          # 도서·판매글에 붙는 담기 토글
        ├── wishlist-list/ (+ skeleton)
        └── wishlist-item/
```

## 2. 핵심 로직

### 프로필 수정

- **닉네임 중복 확인** — `GET /user/check-nickname`으로 저장 전에 검증합니다.
- **핸들(`handle`)** — 공개 프로필 URL(`/users/[handle]`)과 공유 덱(`/share/deck/[handle]`)의 식별자입니다. 변경하면 기존 링크가 깨지므로 확인 후 진행합니다.
- **프로필 이미지** — 클라이언트 압축 후 Vercel Blob 업로드. 표시용 URL 정규화는 `shared/utils/profile-image`가 담당합니다.

### 위시리스트

`wishlist-button`은 도서(`BOOK`)와 판매글(`SALE`) 양쪽에서 재사용됩니다. 초기 상태는 `GET /user/wishlist/check`로 채우고, 토글은 옵티미스틱 업데이트 후 서버 응답으로 정합성을 맞춥니다. 비로그인 상태에서는 로그인으로 유도합니다.

### 회원 탈퇴

`withdrawal-modal` → `DELETE /user/me`. 서버는 `user.withdrawn` 이벤트를 발행하고 9개 리스너가 각 도메인 데이터를 정리합니다([shared 문서](../../../../server/src/shared/README.md#회원-탈퇴-캐스케이드)). 되돌릴 수 없으므로 모달에서 명시적으로 재확인합니다.

> 진행 중인 거래가 있으면 서버가 탈퇴를 차단합니다.

### 통계 대시보드

`GET /user/stats` 기준 완독 수, 리뷰 수, 리액션 등을 표시합니다. 서비스 전체 통계는 [`insights`](../insights/README.md) 기능입니다.

### 신뢰 지표

공개 프로필에는 [`order`](../order/README.md) 기능의 `seller-stats-card` / `seller-trust-badge`가 함께 노출되어 "거래 완료 N건 · 긍정 후기 N%"를 보여줍니다.

## 3. 관련

- 서버: [`features/user`](../../../../server/src/features/user/README.md), [`features/wishlist`](../../../../server/src/features/wishlist/README.md)
- 뷰: `my-page-view`, `user-profile-view`, `wishlist-view`
- 인증 상태(`useAuthStore`)와 로그인 플로우는 [`auth`](../auth/README.md)에 있습니다.
