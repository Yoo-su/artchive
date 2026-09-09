"use client";

import {
  BookOpen,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  RefreshCw,
  ShoppingBag,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/shared/utils/cn"; // we can replicate cn or import it

import { useAuthStore } from "../stores/auth";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 시스템 다크모드 또는 로컬스토리지에 따른 테마 로드
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!user || user.role !== "ADMIN") {
        router.push("/");
      }
    }
  }, [user, mounted, router]);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  if (!mounted || !user || user.role !== "ADMIN") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="h-4 w-4 animate-ping rounded-full bg-neutral-900 dark:bg-neutral-50" />
      </div>
    );
  }

  const menuItems = [
    { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { name: "도서 및 리뷰", href: "/dashboard/reviews", icon: MessageSquare },
    { name: "중고거래 마켓", href: "/dashboard/sales", icon: ShoppingBag },
    { name: "캐시 비우기", href: "/dashboard/cache", icon: RefreshCw },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      {/* 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-neutral-200 dark:border-neutral-900 bg-white dark:bg-neutral-950">
        {/* 상단 로고 */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-150 dark:border-neutral-900 px-6">
          <Link
            href="/dashboard"
            className="text-sm font-semibold tracking-[0.25em] uppercase font-serif"
          >
            Bookjeok
          </Link>
          <span className="text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500 uppercase border border-neutral-200 dark:border-neutral-800 px-2 py-0.5 rounded-none font-mono">
            Admin
          </span>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-xs font-medium tracking-wider uppercase transition-all duration-200 rounded-none border-l-2",
                  isActive
                    ? "border-neutral-900 dark:border-neutral-50 bg-neutral-50 dark:bg-neutral-900/40 text-neutral-900 dark:text-neutral-50"
                    : "border-transparent text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-50 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* 사이드바 하단 프로필 및 테마/로그아웃 */}
        <div className="border-t border-neutral-150 dark:border-neutral-900 p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                {user.nickname}
              </span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-mono">
                {user.email || "No Email"}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-none border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="h-3.5 w-3.5" />
              ) : (
                <Moon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-900/20 py-2.5 text-[10px] tracking-widest font-medium uppercase transition-colors duration-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="pl-64 flex flex-col flex-1 w-full min-h-screen">
        {/* 상단바 */}
        <header className="flex h-16 items-center justify-between border-b border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md px-8 sticky top-0 z-10">
          <h2 className="text-xs font-semibold tracking-widest text-neutral-400 dark:text-neutral-500 uppercase font-mono">
            {menuItems.find(
              (item) =>
                pathname === item.href || pathname.startsWith(item.href + "/"),
            )?.name || "어드민"}
          </h2>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
            {new Date().toLocaleDateString("ko-KR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </header>

        {/* 페이지 내용 */}
        <main className="flex-1 p-8 md:p-10">{children}</main>
      </div>
    </div>
  );
}
