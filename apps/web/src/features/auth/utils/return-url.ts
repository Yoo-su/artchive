const STORAGE_KEY = "auth-return-url";

/**
 * 로그인 페이지로 이동하기 전에 현재 경로를 저장합니다.
 * sessionStorage를 사용하여 탭 단위로 격리하고, 탭 닫힘 시 자동 정리됩니다.
 */
export function saveReturnUrl(url: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, url);
  } catch {
    // SSR 또는 sessionStorage 접근 불가 환경 무시
  }
}

/**
 * 저장된 return URL을 꺼내고 즉시 삭제합니다.
 * 한 번만 사용되어야 하므로 consume 패턴을 사용합니다.
 */
export function consumeReturnUrl(): string | null {
  try {
    const url = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return url;
  } catch {
    return null;
  }
}
