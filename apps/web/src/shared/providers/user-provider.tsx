"use client";

import { getUserProfile } from "@bookjeok/api-client/auth";
import { ReactNode, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { FullScreenLoader } from "@/shared/components/ui/full-screen-loader";
import { privateAxios } from "@/shared/libs/axios";

interface UesrProviderProps {
  children: ReactNode;
}
export default function UserProvider({ children }: UesrProviderProps) {
  const { setUser, accessToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (accessToken) {
        try {
          const user = await getUserProfile(privateAxios);
          setUser(user);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    if (isHydrated) {
      fetchUserProfile();
    }
  }, [accessToken, setUser, isHydrated]);

  if (isLoading || !isHydrated) return <FullScreenLoader />;
  return <>{children}</>;
}
