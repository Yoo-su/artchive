"use client";

import { getUserProfile } from "@bookjeok/api-client";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();

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

  // Normalize path by removing locale prefix (e.g. /ko/my-page -> /my-page)
  const isPrivateRoute = (path: string | null): boolean => {
    if (!path) return false;
    const cleanPath = `/${path.split("/").slice(2).join("/")}`;
    return (
      cleanPath.startsWith("/my-page") ||
      cleanPath === "/book/sales/register" ||
      cleanPath === "/book/reviews/write" ||
      cleanPath.endsWith("/edit")
    );
  };

  const shouldBlock = isPrivateRoute(pathname) && (isLoading || !isHydrated);

  if (shouldBlock) return <FullScreenLoader />;
  return <>{children}</>;
}
