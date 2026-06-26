"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { NotificationPopover } from "@/features/notification/components/notification-popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { LanguageSwitcher } from "../common/language-switcher";
import { Logo } from "../common/logo";
import { MobileNavSheet } from "./mobile-nav-sheet";
import UserPopover from "./user-popover";

// 손글씨 느낌의 꼬불꼬불한 용수철 밑줄 SVG 컴포넌트 (True Looped Spring)
const HandDrawnUnderline = () => (
  <svg
    className="absolute left-0 -top-2.5 w-full h-3 pointer-events-none text-stone-900"
    viewBox="0 0 100 10"
    preserveAspectRatio="none"
  >
    <style>{`
      @keyframes draw-spring {
        from { stroke-dashoffset: 1; }
        to { stroke-dashoffset: 0; }
      }
    `}</style>
    <path
      d="M 0 9 C 5 9 8 2 4 2 S 4 9 16 9 C 21 9 24 2 20 2 S 20 9 32 9 C 37 9 40 2 36 2 S 36 9 48 9 C 53 9 56 2 52 2 S 52 9 64 9 C 69 9 72 2 68 2 S 68 9 80 9 C 85 9 88 2 84 2 S 84 9 96 9 Q 99 9 100 2"
      stroke="currentColor"
      strokeWidth="0.6"
      fill="none"
      vectorEffect="non-scaling-stroke"
      className="opacity-60"
      pathLength="1"
      style={{
        strokeDasharray: 1,
        strokeDashoffset: 1,
        animation: "draw-spring 1s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      }}
    />
  </svg>
);

export const DefaultHeader = () => {
  const t = useTranslations("header");
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentUser = mounted ? user : null;

  const isActive = (path: string) => pathname?.startsWith(path);

  const getLinkClass = (path: string) =>
    cn(
      "relative text-sm font-medium transition-colors duration-200 tracking-wide uppercase",
      isActive(path) ? "text-stone-900" : "text-stone-400 hover:text-stone-600",
    );

  const dropdownContentClass =
    "w-40 p-0 rounded-none border border-stone-200 bg-white shadow-sm";
  const dropdownItemClass =
    "rounded-none px-4 py-3 cursor-pointer hover:bg-stone-50 focus:bg-stone-50 outline-none";
  const dropdownLinkClass =
    "flex items-center text-xs font-medium text-stone-600 hover:text-stone-900";

  return (
    <header className="sticky top-0 left-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="flex items-center justify-between max-w-5xl w-full px-4 py-4 mx-auto">
        {/* 좌측: 모바일 메뉴 + 로고 */}
        <div className="flex items-center gap-4">
          {/* 모바일 햄버거 메뉴 */}
          <MobileNavSheet />

          <Logo />
        </div>

        {/* 중앙: 데스크탑 텍스트 네비게이션 */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label={t("nav.main_menu")}
        >
          {/* 1. 도서 검색 */}
          <Link
            href={PATHS.BOOK_SEARCH}
            className={getLinkClass(PATHS.BOOK_SEARCH)}
          >
            {t("nav.menu_search")}
            {isActive(PATHS.BOOK_SEARCH) && <HandDrawnUnderline />}
          </Link>

          {/* 2. 독서 기록 (로그인 전용) */}
          {currentUser && (
            <Link
              href={PATHS.READING_LOG}
              className={getLinkClass(PATHS.READING_LOG)}
            >
              {t("nav.menu_log")}
              {isActive(PATHS.READING_LOG) && <HandDrawnUnderline />}
            </Link>
          )}

          {/* 2.5 라운지 (공개) */}
          <Link href={PATHS.LOUNGE} className={getLinkClass(PATHS.LOUNGE)}>
            {t("nav.menu_lounge")}
            {isActive(PATHS.LOUNGE) && <HandDrawnUnderline />}
          </Link>

          {/* 3. 중고마켓 그룹 */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative text-sm font-medium transition-colors duration-200 tracking-wide outline-none cursor-pointer uppercase",
                  isActive(PATHS.BOOK_MARKET)
                    ? "text-stone-900"
                    : "text-stone-400 hover:text-stone-600",
                )}
              >
                {t("nav.menu_market")}
                {isActive(PATHS.BOOK_MARKET) && <HandDrawnUnderline />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className={dropdownContentClass}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link href={PATHS.BOOK_MARKET} className={dropdownLinkClass}>
                    <span>{t("nav.market_home")}</span>
                  </Link>
                </DropdownMenuItem>
                {currentUser && (
                  <>
                    <DropdownMenuItem asChild className={dropdownItemClass}>
                      <Link
                        href={PATHS.BOOK_SALES_REGISTER}
                        className={dropdownLinkClass}
                      >
                        <span>{t("nav.write_sales")}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className={dropdownItemClass}>
                      <Link
                        href={PATHS.MY_PAGE_SALES}
                        className={dropdownLinkClass}
                      >
                        <span>{t("nav.my_sales")}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 4. 리뷰 그룹 */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative text-sm font-medium transition-colors duration-200 tracking-wide outline-none cursor-pointer uppercase",
                  isActive(PATHS.REVIEWS)
                    ? "text-stone-900"
                    : "text-stone-400 hover:text-stone-600",
                )}
              >
                {t("nav.menu_reviews")}
                {isActive(PATHS.REVIEWS) && <HandDrawnUnderline />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              className={dropdownContentClass}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className={dropdownItemClass}>
                  <Link href={PATHS.REVIEWS} className={dropdownLinkClass}>
                    <span>{t("nav.review_feed")}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {currentUser && (
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild className={dropdownItemClass}>
                    <Link
                      href={PATHS.REVIEW_WRITE}
                      className={dropdownLinkClass}
                    >
                      <span>{t("nav.write_review")}</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className={dropdownItemClass}>
                    <Link href={PATHS.MY_REVIEWS} className={dropdownLinkClass}>
                      <span>{t("nav.my_reviews")}</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 5. 인사이트 */}
          <Link href={PATHS.INSIGHTS} className={getLinkClass(PATHS.INSIGHTS)}>
            {t("nav.menu_insights")}
            {isActive(PATHS.INSIGHTS) && <HandDrawnUnderline />}
          </Link>
        </nav>

          {/* 우측: 사용자 메뉴 */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden md:flex" />
            {!mounted ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100/80 animate-pulse border border-stone-200/40 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-stone-200/50" />
                </div>
                <div className="w-10 h-10 rounded-full bg-stone-200/60 animate-pulse border border-stone-200/40" />
              </div>
            ) : currentUser ? (
              <>
                <div className="mr-1">
                  <NotificationPopover />
                </div>
                <UserPopover />
              </>
            ) : (
              <Link href={PATHS.LOGIN}>
                <span className="text-sm font-medium text-stone-400 hover:text-stone-900 transition-colors tracking-wide uppercase">
                  {t("nav.menu_login")}
                </span>
              </Link>
            )}
          </div>
      </div>
    </header>
  );
};
