"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { config } from "@/shared/config/env";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({
  children,
  namespace,
}: {
  children: React.ReactNode;
  namespace: string;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  useEffect(() => {
    if (accessToken) {
      const newSocket = io(`${config.NEXT_PUBLIC_API_URL}${namespace}`, {
        transports: ["websocket"],
        auth: {
          token: accessToken,
        },
        // 재연결 설정 - Safari 등에서 유휴 상태 후 연결 복구를 위해 강화
        reconnection: true, // 자동 재연결 활성화
        reconnectionAttempts: Infinity, // 무한 재연결 시도
        reconnectionDelay: 1000, // 첫 재연결 시도까지 1초 대기
        reconnectionDelayMax: 5000, // 최대 5초까지 지수 백오프 (서버 과부하 방지)
        randomizationFactor: 0.5, // 재연결 지연에 랜덤 요소 추가 (동시 재연결 방지)
      });

      newSocket.on("connect", () => {
        setIsConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        setIsConnected(false);
      });

      // 재연결 관련 이벤트 핸들러
      newSocket.on("reconnect", (attemptNumber) => {
        console.log(
          `Socket reconnected to ${namespace} after ${attemptNumber} attempts`,
        );
      });

      newSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(
          `Socket reconnection attempt ${attemptNumber} to ${namespace}`,
        );
      });

      newSocket.on("reconnect_error", (error) => {
        console.error(`Socket reconnection error on ${namespace}:`, error);
      });

      newSocket.on("connect_error", (error) => {
        console.error(`Socket connection error on ${namespace}:`, error);
        setIsConnected(false);
      });

      newSocket.on("connected", (data) => {});

      newSocket.on("error", (error) => {
        console.error(`Socket error on ${namespace}:`, error.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [accessToken, namespace]);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
