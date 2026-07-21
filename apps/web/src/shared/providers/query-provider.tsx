"use client";

import "@/shared/libs/axios";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";

import { config } from "@/shared/config/env";
import { getQueryClient } from "@/shared/libs/query-client";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  // QueryClient를 state로 관리하여 리렌더링 시 새로운 인스턴스 생성 방지
  const [queryClientState] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClientState}>
      {children}
      {/* 개발 환경에서만 DevTools 표시 */}
      {config.isDev && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};
