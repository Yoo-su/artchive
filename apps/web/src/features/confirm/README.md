# Frontend Feature: Confirm (전역 확인 다이얼로그)

브라우저 `window.confirm`을 대체하는 Promise 기반 확인 다이얼로그입니다. **React 컴포넌트 밖(axios 인터셉터, 유틸 함수 등)에서도 한 줄로 호출**할 수 있는 것이 핵심입니다.

## 폴더 구조

```
confirm/
├── index.ts
├── types/index.ts             # ConfirmOptions, ConfirmRequest
├── stores/confirm-store.ts    # Zustand 큐 + standalone confirm()
├── hooks/use-confirm.ts       # 컴포넌트용 훅 래퍼
└── components/confirm-host.tsx # 실제 다이얼로그를 렌더링하는 호스트
```

## 사용법

```tsx
// 컴포넌트 안
const confirm = useConfirm();
const ok = await confirm({ title: "삭제할까요?", description: "되돌릴 수 없습니다." });
if (!ok) return;

// 컴포넌트 밖 (인터셉터, 유틸 등)
import { confirm } from "@/features/confirm";
if (await confirm({ title: "세션이 만료되었습니다", confirmText: "다시 로그인" })) { ... }
```

## 동작

```
confirm(options)  ──▶  Promise<boolean> 생성
       │                    resolve 함수를 request에 담아 큐에 push
       ▼
useConfirmStore.queue  [ req1, req2, ... ]
       │
       ▼
<ConfirmHost />  큐의 첫 항목을 다이얼로그로 렌더
       │  사용자 선택
       ▼
resolveCurrent(value)  ──▶  대기 중이던 Promise resolve + 큐에서 제거
```

- **큐 방식**이라 확인 요청이 동시에 여러 개 들어와도 하나씩 순서대로 처리되고, 각 호출자는 자기 Promise만 받습니다.
- `ConfirmHost`는 레이아웃에 **한 번만** 마운트합니다. 여러 번 마운트하면 같은 요청이 중복 렌더링됩니다.
- `crypto.randomUUID`가 없는 환경을 위한 폴백 ID 생성이 들어 있습니다.

## 관련

- 토스트/알림은 `sonner`를 사용합니다. 이 기능은 **사용자 확인이 필요한 차단성 상호작용** 전용입니다.
