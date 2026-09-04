import { OrderStatus } from './entities/order.entity';

/**
 * 아직 끝나지 않은 주문의 상태 목록.
 *
 * 이 상태의 주문이 걸려 있는 판매글은 수정·삭제·수동 상태 변경이 막히고,
 * 해당 채팅방은 나갈 수 없습니다. 상태가 하나 늘 때마다 네 곳을 따로
 * 고치는 일이 없도록 여기서만 정의합니다.
 */
export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  OrderStatus.AWAITING_PAYMENT,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.DISPUTED,
] as const;
