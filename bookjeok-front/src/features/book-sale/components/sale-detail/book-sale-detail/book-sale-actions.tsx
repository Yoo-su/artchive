import { useQueryClient } from "@tanstack/react-query";
import { Edit, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { chatKeys } from "@/features/chat";
import { findOrCreateRoom } from "@/features/chat/apis";
import { useChatStore } from "@/features/chat/stores/use-chat-store";
import { WishlistButton } from "@/features/user/components/wishlist/wishlist-button";
import { CoolMode } from "@/shared/components/magicui/cool-mode";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/shadcn/alert-dialog";
import { Button } from "@/shared/components/shadcn/button";
import { UserAvatarMenu } from "@/shared/components/ui/user-avatar-menu";
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { useSocketContext } from "@/shared/providers/socket-provider";

import { useDeleteBookSaleMutation } from "../../../mutations";
import { UsedBookSale } from "../../../types";

interface BookSaleActionsProps {
  sale: UsedBookSale;
}

/** 판매자 정보 + 액션 버튼 (수정/삭제/채팅/찜) */
export const BookSaleActions = ({ sale }: BookSaleActionsProps) => {
  const t = useTranslations("market.detail");
  const currentUser = useAuthStore((state) => state.user);
  const isOwner = currentUser?.id === sale.user.id;
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { openChatRoom } = useChatStore();
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();
  const { mutate: deleteSale, isPending: isDeleting } =
    useDeleteBookSaleMutation();

  const handleStartChat = async () => {
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
      openChatRoom(newRoom.id, queryClient);
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error(t("actions.chat_error"));
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <UserAvatarMenu
        user={sale.user}
        showNickname
        label={t("actions.seller")}
        size="lg"
      />
      {isOwner ? (
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={PATHS.MY_PAGE_SALES_EDIT(String(sale.id))}>
              <Edit className="w-4 h-4 mr-2" />
              {t("actions.edit")}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? t("actions.deleting") : t("actions.delete")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("actions.delete_title")}</AlertDialogTitle>
                <AlertDialogDescription className="whitespace-pre-wrap">
                  {t("actions.delete_desc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    deleteSale({ saleId: sale.id, imageUrls: sale.imageUrls })
                  }
                >
                  {t("actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
    </div>
  );
};
