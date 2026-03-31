"use client";

import { NEOGULIP_TEXTS } from "@bookjeok/core";
import { RefreshCw } from "lucide-react";

import { useRecommendStore } from "@/features/recommend/stores/recommend-store";
import { NeogulipIcon } from "@/shared/components/icons/neogulip-icon";
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

export const TasteFinderHeader = ({
  setInput,
}: {
  setInput: (value: string) => void;
}) => {
  const clearMessages = useRecommendStore((state) => state.clearMessages);

  return (
    <div className="flex items-center justify-between p-4 border-b border-neogulip-bg-accent bg-white/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-neogulip-bg rounded-full flex items-center justify-center overflow-hidden border-2 border-neogulip-border shadow-sm group cursor-pointer transition-transform hover:scale-105">
            <NeogulipIcon
              width="120%"
              height="120%"
              className="mt-2 group-hover:animate-wiggle"
            />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
          </span>
        </div>
        <div>
          <h2 className="font-bold text-neogulip-brown-primary flex items-center gap-2">
            {NEOGULIP_TEXTS.NAME}
            <span className="px-2 py-0.5 text-[10px] bg-neogulip-bg-accent text-neogulip-dark rounded-full border border-neogulip-border">
              {NEOGULIP_TEXTS.ROLE}
            </span>
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-600 rounded-full border border-amber-200">
              {NEOGULIP_TEXTS.BETA_LABEL}
            </span>
          </h2>
          <p className="text-xs text-neogulip-brown-secondary">
            {NEOGULIP_TEXTS.DESCRIPTION}
          </p>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="p-2 text-neogulip-brown-light hover:text-neogulip-dark hover:bg-neogulip-bg rounded-full transition-colors"
            title="대화 초기화"
          >
            <RefreshCw size={20} />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-neogulip-bg border-neogulip-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neogulip-text">
              {NEOGULIP_TEXTS.RESET_TITLE}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neogulip-subtext">
              {NEOGULIP_TEXTS.RESET_DESC}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-neogulip-border text-neogulip-subtext hover:bg-neogulip-bg-accent hover:text-neogulip-text rounded-xl">
              {NEOGULIP_TEXTS.RESET_CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearMessages();
                setInput("");
              }}
              className="bg-neogulip-light text-white hover:bg-neogulip-primary rounded-xl"
            >
              {NEOGULIP_TEXTS.RESET_CONFIRM}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
