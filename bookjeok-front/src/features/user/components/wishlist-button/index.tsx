"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/store";
import { BookInfo } from "@/features/book/types";
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "@/features/user/mutations";
import { useWishlistStatusQuery } from "@/features/user/queries";
import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils";

interface WishlistButtonProps {
  type: "BOOK" | "SALE";
  id: string | number;
  className?: string;
  bookData?: BookInfo;
  initialIsWishlisted?: boolean;
}

export const WishlistButton = ({
  type,
  id,
  className,
  bookData,
  initialIsWishlisted,
}: WishlistButtonProps) => {
  const user = useAuthStore((state) => state.user);

  // initialIsWishlisted가 주어지면 쿼리를 실행하지 않음 (이미 상태를 알고 있음)
  const shouldFetch = !!user && initialIsWishlisted === undefined;

  const { data: statusData, isLoading } = useWishlistStatusQuery(
    type,
    id,
    shouldFetch
  );

  const [isWishlisted, setIsWishlisted] = useState(
    initialIsWishlisted ?? false
  );

  const addToWishlistMutation = useAddToWishlistMutation();
  const removeFromWishlistMutation = useRemoveFromWishlistMutation();

  useEffect(() => {
    if (statusData) {
      setIsWishlisted(statusData.isWishlisted);
    }
  }, [statusData]);

  // initialIsWishlisted가 변경되면 상태 업데이트 (단, 사용자가 인터랙션 한 후에는 무시될 수 있음)
  useEffect(() => {
    if (initialIsWishlisted !== undefined) {
      setIsWishlisted(initialIsWishlisted);
    }
  }, [initialIsWishlisted]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 비로그인 시 버튼이 disabled이므로 여기로 오지 않지만, 방어 코드 유지
    if (!user) return;

    if (isWishlisted) {
      setIsWishlisted(false);
      removeFromWishlistMutation.mutate(
        { type, id },
        {
          onError: () => setIsWishlisted(true), // Rollback
        }
      );
    } else {
      setIsWishlisted(true);
      addToWishlistMutation.mutate(
        { type, id, bookData },
        {
          onError: () => setIsWishlisted(false), // 롤백
        }
      );
    }
  };

  // 로딩 중이거나 비로그인 상태면 disabled (단, 초기값이 있으면 로딩 무시)
  const isButtonLoading = isLoading && initialIsWishlisted === undefined;

  if (isButtonLoading || !user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn("rounded-full", className)}
        disabled
      >
        <Heart className="w-5 h-5 text-gray-300" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("rounded-full hover:bg-transparent", className)}
      onClick={handleToggle}
    >
      <Heart
        className={cn(
          "w-6 h-6 transition-colors duration-200",
          isWishlisted
            ? "fill-red-500 text-red-500"
            : "text-gray-400 hover:text-red-500"
        )}
      />
    </Button>
  );
};
