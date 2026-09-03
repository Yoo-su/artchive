# Frontend Feature: Art (문화예술 정보)

KOPIS 공연·전시 정보를 홈 슬라이더와 상세 페이지로 노출합니다.

## 1. 폴더 구조

```
art/
├── components/
│   ├── widgets/art-slider/
│   │   ├── main-art-slider/          # 홈 슬라이더 (index · main-art-card)
│   │   └── skeleton.tsx
│   ├── detail/art-detail/            # 공연 상세 (index · skeleton)
│   └── common/art-json-ld/           # Event 구조화 데이터
```

## 2. 데이터 경로

```
KOPIS 공공 API (XML)
      │
      ▼  CULTURE_SERVICE_KEY로 인증, fast-xml-parser로 파싱
apps/server  GET /art/external/list · /art/external/detail/:id
      │
      ▼  ISR 캐싱 계층
apps/web     /api/art-list · /api/art-detail/[id]  (route handler)
      │
      ▼
main-art-slider · art-detail
```

브라우저에서 KOPIS를 직접 호출하지 않습니다 — API 키 은닉, XML→JSON 변환, CORS 세 가지 이유 때문입니다.

## 3. 이미지 도메인

KOPIS 포스터는 `www.kopis.or.kr`에서 제공되며, `next.config.ts`의 `images.remotePatterns`에 등록되어 있습니다. 이미지 호스트가 바뀌면 이 설정도 함께 추가해야 `next/image`가 렌더링합니다.

## 4. 관련

- 서버: [`features/art`](../../../../server/src/features/art/README.md)
- 라우트: `/art/[id]` (`art-detail-view`)
