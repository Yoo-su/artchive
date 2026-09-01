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
import { SellerTrustBadge } from "@/features/order";
import { WishlistButton } from "@/features/user/components/wishlist/wishlist-button";
import { CoolMode } from "@/shared/components/magicui/cool-mode";
import { Button } from "@/shared/components/shadcn/button";
import { UserAvatarMenu } from "@/shared/components/ui/user-avatar-menu";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useDeleteBookSaleMutation } from "../../../mutations";

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
        <div className="flex gap-2">
          {sale.status === "RESERVED" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled
                title={t("actions.in_trade_cannot_modify")}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Edit className="w-4 h-4 mr-2" />
                {t("actions.edit")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled
                title={t("actions.in_trade_cannot_modify")}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("actions.delete")}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t("actions.edit")}
                </Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteSale}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? t("actions.deleting") : t("actions.delete")}
              </Button>
            </>
          )}
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
