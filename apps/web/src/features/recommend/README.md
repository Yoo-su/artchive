# Frontend Feature: Recommend

프론트엔드의 `recommend` 기능은 사용자에게 **AI 기반의 도서 추천 서비스(Taste Finder)**를 제공합니다. RAG (Retrieval-Augmented Generation) 패턴을 활용한 대화형 인터페이스를 통해 맞춤형 추천 결과를 보여줍니다.

## 1. 주요 파일 및 역할

- **`features/recommend/apis/index.ts`**: 추천 API 함수 정의
  - `talkToAiLibrarian`: 사용자 입력 메시지를 전송하고 AI 응답을 스트리밍으로 받음
- **`features/recommend/stores/recommend-store.ts`**: 추천 세션 상태 관리 (대화 내용, 추천 도서 데이터, 로딩 상태 등)
- **`features/recommend/components/`**: **Context-Based Grouping**
  - **`widgets/`**: 전역 추천 위젯 (`taste-finder-widget`)
  - **`finder/`**: 추천 챗봇 UI (`taste-finder`)

## 2. AI 취향 탐색기 (Taste Finder)

- **대화형 UI**: 채팅 인터페이스를 통해 사용자의 상황과 기분을 파악합니다.
- **클라이언트 타자기 효과**: AI의 응답은 일반 API JSON으로 전달받되, 프론트엔드 단에서 실시간 타자기 효과(Typing effect)로 연출하여 사용자 경험을 높입니다.
- **추천 결과 카드**: 대화가 끝나고 추천 도서가 결정되면, AI가 반환한 구조화된 데이터(JSON)를 파싱하여 `RecommendedBook` 카드로 렌더링합니다.
