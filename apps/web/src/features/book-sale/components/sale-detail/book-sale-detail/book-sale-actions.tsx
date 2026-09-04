import { findOrCreateRoom } from "@bookjeok/api-client";
import { chatKeys, UsedBookSale } from "@bookjeok/core";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmailVerificationModal } from "@/features/auth/components/email-verification-alert";
import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { useOpenChatRoom } from "@/features/chat/hooks/use-open-chat-room";
import { useConfirm } from "@/features/confirm";
import { SellerTrustBadge } from "@/features/trade";
import { WishlistButton } from "@/features/user/components/wishlist/wishlist-button";
import { CoolMode } from "@/shared/components/magicui/cool-mode";
import { Button } from "@/shared/components/shadcn/button";
import { UserAvatarMenu } from "@/shared/components/ui/user-avatar-menu";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useDeleteBookSaleMutation } from "../../../mutations";
import { SaleStatusSelect } from "../../common/sale-status-select";

interface BookSaleActionsProps {
  sale: UsedBookSale;
}

/** 판매자 정보 + 액션 버튼 (수정/삭제/채팅/찜) */
export const BookSaleActions: React.FC<BookSaleActionsProps> = ({ sale }) => {
  const t = useTranslations("market.detail");
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const currentUser = mounted ? user : null;
  const isOwner = currentUser?.id === sale.user.id;
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const openChatRoom = useOpenChatRoom();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { mutate: deleteSale, isPending: isDeleting } =
    useDeleteBookSaleMutation();
  const confirm = useConfirm();

  // 수정·삭제를 막는 근거는 활성 주문이지 예약중 상태가 아니다.
  const isLockedByOrder = sale.hasActiveOrder === true;

  const handleDeleteSale = async () => {
    const isConfirmed = await confirm({
      title: t("actions.delete_title"),
      description: t("actions.delete_desc"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
      variant: "destructive",
    });

    if (isConfirmed) {
      deleteSale({ saleId: sale.id, imageUrls: sale.imageUrls });
    }
  };

  const handleStartChat = async () => {
    if (currentUser && !currentUser.isEmailVerified) {
      setIsVerificationModalOpen(true);
      return;
    }

    setIsCreatingChat(true);
    try {
      // 1. API를 통해 채팅방을 생성 또는 조회합니다.
      const newRoom = await findOrCreateRoom(sale.id);

      // 2. 새로 생성된 채팅방에 소켓을 조인시킵니다.
      if (socket) {
        socket.emit("joinRooms", [newRoom.id]);
      }

      // 3. 채팅방 목록 쿼리를 무효화하여 최신 목록을 다시 불러옵니다.
      await queryClient.invalidateQueries({
        queryKey: chatKeys.rooms.queryKey,
      });

      // 4. 채팅 위젯에서 해당 채팅방을 엽니다.
      openChatRoom(newRoom.id);
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error(t("actions.chat_error"));
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <UserAvatarMenu
          user={sale.user}
          showNickname
          label={t("actions.seller")}
          size="lg"
        />
        {sale.user?.handle && (
          <SellerTrustBadge handle={sale.user.handle} size="sm" />
        )}
      </div>
      {!mounted ? (
        <div className="flex gap-2 w-full sm:w-auto items-center justify-end animate-pulse">
          {sale.status === "FOR_SALE" && (
            <div className="w-11 h-11 bg-stone-100 rounded-md border border-stone-200/60" />
          )}
          <div className="w-32 h-11 bg-stone-200/80 rounded-md" />
        </div>
      ) : isOwner ? (
        /*
         * 모바일에서는 상태 셀렉트가 한 줄, 수정·삭제가 그 아래 한 줄로 떨어지게
         * 두고, sm 이상에서만 한 줄에 나란히 놓는다. 셋을 무조건 한 줄에 밀어
         * 넣으면 좁은 화면에서 삭제 버튼만 어정쩡하게 튕겨 나간다.
         */
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          {/* 상태 변경은 마이페이지까지 가지 않아도 되도록 상세에서도 노출한다 */}
          <SaleStatusSelect sale={sale} className="h-9 w-full sm:w-[120px]" />

          <div className="flex items-center gap-2">
            <Button
              asChild={!isLockedByOrder}
              variant="outline"
              size="sm"
              disabled={isLockedByOrder}
              title={
                isLockedByOrder ? t("actions.in_trade_cannot_modify") : undefined
              }
              className="h-9 flex-1 sm:flex-none"
            >
              {isLockedByOrder ? (
                <span>
                  <Edit className="w-4 h-4 mr-1.5" />
                  {t("actions.edit")}
                </span>
              ) : (
                <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
                  <Edit className="w-4 h-4 mr-1.5" />
                  {t("actions.edit")}
                </Link>
              )}
            </Button>

            {/*
             * 삭제는 평소엔 조용히 있다가 hover에서만 위험을 드러낸다.
             * 회원 탈퇴 버튼과 같은 패턴.
             */}
            <Button
              variant="outline"
              size="sm"
              disabled={isLockedByOrder || isDeleting}
              title={
                isLockedByOrder ? t("actions.in_trade_cannot_modify") : undefined
              }
              onClick={handleDeleteSale}
              className="h-9 flex-1 border-stone-300 text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-stone-700 dark:text-stone-300 dark:hover:border-red-800 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:flex-none"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {isDeleting ? t("actions.deleting") : t("actions.delete")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            {sale.status === "FOR_SALE" && (
              <WishlistButton
                type="SALE"
                id={sale.id}
                className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 w-11 rounded-md"
              />
            )}
            <CoolMode>
              <Button
                size="lg"
                className="flex-1 sm:flex-none h-11"
                onClick={handleStartChat}
                disabled={isCreatingChat || !currentUser}
              >
                {isCreatingChat ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5 mr-2" />
                )}
                {isCreatingChat
                  ? t("actions.chat_opening")
                  : t("actions.chat_start")}
              </Button>
            </CoolMode>
          </div>
          {!currentUser && (
            <p className="text-xs text-stone-400 text-center sm:text-right">
              {t("actions.login_required")}
            </p>
          )}
        </div>
      )}

      <EmailVerificationModal
        open={isVerificationModalOpen}
        onOpenChange={setIsVerificationModalOpen}
        actionName="중고거래 채팅"
      />
    </div>
  );
};
