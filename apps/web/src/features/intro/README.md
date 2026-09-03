# Frontend Feature: Intro (홈 히어로 인트로)

메인 페이지(`/`) 상단의 스크롤 연동 히어로 섹션입니다. 서비스의 세 축(독서 기록 · 중고 거래 · 리뷰)을 장면 전환으로 소개하고 마지막에 로고로 수렴합니다.

## 폴더 구조

```
intro/
├── constants/data.ts               # SCENES 정의
├── types/index.ts
└── components/hero/home-hero/
    ├── index.tsx                   # 스크롤 진행도 → 장면 전환 오케스트레이션
    ├── record-scene.tsx            # 독서 기록
    ├── used-scene.tsx              # 중고 거래
    ├── review-scene.tsx            # 리뷰
    ├── logo-scene.tsx              # 브랜드 로고 마무리
    └── scroll-guide.tsx            # 스크롤 유도 인디케이터
```

## 장면 정의

```typescript
export const SCENES = [
  { id: "record", accentClass: "text-stone-900" },
  { id: "used",   accentClass: "text-slate-900" },
  { id: "review", accentClass: "text-zinc-900" },
  { id: "logo",   accentClass: "text-neogulip-primary" },
] as const;
```

장면을 추가하거나 순서를 바꿀 때는 `SCENES` 배열만 수정하면 되고, 각 `id`에 대응하는 `*-scene.tsx`를 함께 만들면 됩니다.

## 구현 메모

- 전환은 Framer Motion / GSAP 기반이며 스크롤 진행도를 각 장면의 진입·이탈 애니메이션에 매핑합니다.
- 텍스트는 `next-intl` 번역 키를 사용합니다. 문구를 하드코딩하지 마세요.
- `useReducedMotion`(`shared/hooks/use-prefers-reduced-motion`)을 존중해, 모션 최소화 설정에서는 전환을 단순화합니다.
- 홈 첫 화면이라 LCP에 직접 영향을 줍니다. 이미지 추가 시 우선순위와 포맷을 함께 확인하세요.
