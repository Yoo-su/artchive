export interface PendingOrderShipping {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  zipCode: string;
  address: string;
  addressDetail?: string;
  deliveryMemo?: string;
  savedAt: number;
}

const STORAGE_PREFIX = "bookjeok_order_shipping_";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24시간 유효

/**
 * 결제 진행 전 배송지 정보를 세션 및 로컬 스토리지에 저장합니다.
 * (모바일 앱카드/결제창 전환 후 새 탭/새 세션 리디렉션 시 유실 방지)
 */
export const savePendingOrderShipping = (
  shipping: PendingOrderShipping,
): void => {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${shipping.orderId}`;
  const data = JSON.stringify(shipping);

  try {
    sessionStorage.setItem(key, data);
  } catch (error) {
    console.error(
      "Failed to save pending order shipping to sessionStorage:",
      error,
    );
  }

  try {
    localStorage.setItem(key, data);
  } catch (error) {
    console.error(
      "Failed to save pending order shipping to localStorage:",
      error,
    );
  }
};

/**
 * 주문 ID로 저장된 배송지 정보를 조회합니다.
 * sessionStorage를 우선 조회하고, 없을 경우 localStorage(24h 유효)에서 복구합니다.
 */
export const getPendingOrderShipping = (
  orderId: string,
): PendingOrderShipping | null => {
  if (typeof window === "undefined") return null;
  const key = `${STORAGE_PREFIX}${orderId}`;

  // 1. sessionStorage 확인
  try {
    const sessionData = sessionStorage.getItem(key);
    if (sessionData) {
      const parsed = JSON.parse(sessionData) as PendingOrderShipping;
      if (Date.now() - parsed.savedAt <= MAX_AGE_MS) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(
      "Failed to get pending order shipping from sessionStorage:",
      error,
    );
  }

  // 2. localStorage fallback 확인
  try {
    const localData = localStorage.getItem(key);
    if (localData) {
      const parsed = JSON.parse(localData) as PendingOrderShipping;
      if (Date.now() - parsed.savedAt <= MAX_AGE_MS) {
        return parsed;
      } else {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error(
      "Failed to get pending order shipping from localStorage:",
      error,
    );
  }

  return null;
};

/**
 * 결제 완료 또는 취소 후 저장된 배송지 정보를 삭제합니다.
 */
export const clearPendingOrderShipping = (orderId: string): void => {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_PREFIX}${orderId}`;
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error(
      "Failed to clear pending order shipping from sessionStorage:",
      error,
    );
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(
      "Failed to clear pending order shipping from localStorage:",
      error,
    );
  }
};
