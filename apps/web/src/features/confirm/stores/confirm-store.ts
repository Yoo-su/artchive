import { create } from "zustand";

import { ConfirmOptions, ConfirmRequest } from "../types";

interface ConfirmState {
  queue: ConfirmRequest[];
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  resolveCurrent: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  queue: [],
  confirm: (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const newRequest: ConfirmRequest = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2),
        options,
        resolve,
      };
      set((state) => ({ queue: [...state.queue, newRequest] }));
    });
  },
  resolveCurrent: (value: boolean) => {
    const { queue } = get();
    const current = queue[0];
    if (current) {
      current.resolve(value);
      set({ queue: queue.slice(1) });
    }
  },
}));

/**
 * JS/TS 및 비컴포넌트 환경(인터셉터 등)에서도 한 줄로 직접 호출 가능한 standalone confirm 함수
 */
export const confirm = (options: ConfirmOptions) =>
  useConfirmStore.getState().confirm(options);
