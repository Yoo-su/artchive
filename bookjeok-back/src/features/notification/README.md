# Notification Module (`features/notification`)

`NotificationModule`은 사용자 알림 시스템을 제공합니다. 리뷰 리액션, 댓글 작성/좋아요 등의 이벤트 발생 시 실시간 알림을 생성하고 조회하는 기능을 담당합니다.

## 1. 주요 파일 및 역할

- **`notification.controller.ts`**: `/notifications` 경로의 API 엔드포인트를 정의합니다.
- **`notification.service.ts`**: 알림 생성, 조회, 읽음 처리 등 비즈니스 로직을 처리합니다.
- **`notification.gateway.ts`**: Socket.IO를 이용해 실시간 알림 이벤트를 클라이언트로 전송합니다.
- **`interceptors/`**: 알림 자동 발송을 위한 인터셉터 모듈입니다.
  - **`notification.interceptor.ts`**: 데코레이터가 붙은 메서드의 성공 결과를 가로채 알림 발송을 위임합니다.
- **`decorators/`**:
  - **`notification.decorator.ts`**: 서비스 메서드에 알림 트리거를 설정하는 `@Notify` 데코레이터를 정의합니다.
- **`types/`**: 알림 관련 타입 정의 모듈입니다.
  - **`notification-strategy.type.ts`**: 알림 전략 패턴을 위한 공통 인터페이스를 정의합니다.
- **`strategies/`**: 각 알림 유형별 데이터 가공 로직(=전략)을 담고 있습니다.
  - **`notification-strategy.factory.ts`**: 알림 유형에 맞는 전략을 동적으로 선택합니다.
- **`entities/notification.entity.ts`**: 알림 정보를 저장하는 TypeORM 엔티티입니다.
- **`dto/`**: API 요청/응답에 사용되는 DTO 파일들입니다.

## 2. AOP 기반 알림 시스템 (Architecture)

본 모듈은 서비스 로직의 결합도를 낮추고 확장성을 높이기 위해 **Interceptor & Strategy 패턴**을 사용합니다.

### 동작 원리

1. **Trigger**: 서비스 메서드 위에 `@Notify(NotificationType.*)` 데코레이터를 붙입니다.
2. **Intercept**: `NotificationInterceptor`가 해당 메서드의 실행이 성공적으로 끝날 때까지 기다립니다.
3. **Resolve**: `NotificationStrategyFactory`를 통해 해당 알림 타입에 맞는 **전략(Strategy)** 객체를 찾아옵니다.
4. **Process**: 전략 객체(`ReviewCommentStrategy` 등)가 메서드의 반환값(`return value`)을 분석하여 알림 수신자(Recipient)와 메타데이터를 추출합니다.
5. **Dispatch**: 추출된 정보를 바탕으로 `NotificationService`가 DB에 알림을 저장하고, `SocketGateway`로 실시간 푸시를 보냅니다.

### 새로운 알림 추가 방법

1. **전략 구현**: `strategies/` 폴더에 `NotificationStrategy`를 구현하는 새 클래스를 만듭니다. (페이로드 생성 로직 작성)
2. **팩토리 등록**: `NotificationStrategyFactory`의 `strategies` 맵에 새 타입을 등록합니다.
3. **데코레이터 적용**: 알림을 보내고 싶은 서비스 메서드 위에 `@Notify`를 붙입니다.

## 2. API 엔드포인트

| HTTP Method | 경로 (`/notifications/...`) | 설명                                  | 인증 필요 |
| :---------- | :-------------------------- | :------------------------------------ | :-------- |
| `GET`       | `/`                         | 내 알림 목록 조회 (커서 페이지네이션) | ✅        |
| `GET`       | `/unread-count`             | 안 읽은 알림 수 조회                  | ✅        |
| `PATCH`     | `/read-all`                 | 모든 알림 읽음 처리                   | ✅        |
| `PATCH`     | `/:id/read`                 | 특정 알림 읽음 처리                   | ✅        |

## 3. 엔티티 스키마

### `Notification`

| 컬럼명        | 타입      | 설명                                                      |
| :------------ | :-------- | :-------------------------------------------------------- |
| `id`          | `number`  | 알림 ID (PK)                                              |
| `recipientId` | `number`  | 수신자 ID                                                 |
| `actorId`     | `number`  | 알림 유발자 ID                                            |
| `type`        | `enum`    | 알림 유형 (REVIEW_REACTION, REVIEW_COMMENT, COMMENT_LIKE) |
| `metadata`    | `jsonb`   | 알림 구성에 필요한 동적 데이터 (책 제목, 리뷰 제목 등)    |
| `isRead`      | `boolean` | 읽음 여부                                                 |
| `createdAt`   | `Date`    | 생성일                                                    |

## 4. 실시간 알림 (Socket.IO)

- **Namespace**: `/notification`
- **Event**: `newNotification`
- **Payload**: `Notification` 엔티티 객체

클라이언트는 소켓 연결 후 `newNotification` 이벤트를 리스닝하여 실시간 알림을 수신할 수 있습니다.
