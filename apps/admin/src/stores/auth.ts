import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AdminUser {
  id: number;
  email: string | null;
  nickname: string;
  role: "USER" | "ADMIN";
}

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  setUser: (user: AdminUser | null) => void;
  setToken: (accessToken: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user) => set({ user }),
      setToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    {
      name: "admin-auth-storage",
    },
  ),
);
