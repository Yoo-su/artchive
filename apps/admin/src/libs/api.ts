import { privateApiClient, publicApiClient } from "@bookjeok/api-client";
import axios from "axios";

import { useAuthStore } from "../stores/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// @bookjeok/api-client 싱글톤 초기화
publicApiClient.defaults.baseURL = baseURL;
privateApiClient.defaults.baseURL = baseURL;

const authRequestInterceptor = (config: any) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

privateApiClient.interceptors.request.use(authRequestInterceptor);

// 기존 어드민 앱에서 사용하던 api 인스턴스
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(authRequestInterceptor);
