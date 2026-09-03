import axios from "axios";

import { useAuthStore } from "../stores/auth";

/**
 * 웹 서비스의 ISR 캐시를 비웁니다.
 *
 * 시크릿은 어드민 서버(/api/revalidate)에만 있으므로 자기 오리진으로 호출한다.
 * @param path 재검증할 경로 (로케일 포함, 예: /ko/book/market)
 */
export const requestRevalidate = async (path: string) => {
  const token = useAuthStore.getState().accessToken;

  const { data } = await axios.post<{ revalidated?: boolean; now?: number }>(
    "/api/revalidate",
    { path },
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );

  return data;
};
