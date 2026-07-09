"use client";

import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";

import { api } from "../libs/api";
import { useAuthStore } from "../stores/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, setToken, setUser, clearAuth } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 이미 로그인된 상태이고 관리자라면 대시보드로 이동
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      const { accessToken, user: loggedInUser } = response.data.data; // ResponseWrapper 형식 대응

      if (loggedInUser.role !== "ADMIN") {
        setError("관리자 권한이 없는 계정입니다.");
        clearAuth();
        setLoading(false);
        return;
      }

      setToken(accessToken);
      setUser(loggedInUser);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("로그인 중 에러가 발생했습니다.");
      }
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-neutral-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-normal tracking-[0.2em] uppercase text-neutral-900 dark:text-neutral-50 font-serif">
            Bookjeok Admin
          </h1>
          <p className="text-xs tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            관리자 로그인
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소"
                className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-transparent py-3 px-1 text-sm outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-50 text-neutral-900 dark:text-neutral-50 placeholder-neutral-300 dark:placeholder-neutral-700"
              />
            </div>
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-transparent py-3 px-1 text-sm outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-50 text-neutral-900 dark:text-neutral-50 placeholder-neutral-300 dark:placeholder-neutral-700"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-light tracking-wide text-center">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-neutral-900 dark:border-neutral-50 bg-neutral-900 dark:bg-neutral-50 hover:bg-white dark:hover:bg-neutral-950 text-white dark:text-neutral-950 hover:text-neutral-900 dark:hover:text-neutral-50 py-3 text-xs tracking-[0.15em] font-medium uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "기다리는 중..." : "로그인"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
