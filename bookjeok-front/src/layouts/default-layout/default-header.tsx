"use client";

import {
  BarChart3,
  CalendarDays,
  List,
  MessageSquareQuote,
  PenLine,
  PenSquare,
  Search,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Button } from "@/shared/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/shadcn/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { Logo } from "../common/logo";
import { MobileNavSheet } from "./mobile-nav-sheet";
import UserPopover from "./user-popover";

export const DefaultHeader = () => {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const isActive = (path: string) => pathname?.startsWith(path);

  const getIconClass = (path: string) =>
    cn(
      "w-5 h-5 transition-colors duration-200",
      isActive(path)
        ? "text-amber-600 fill-amber-100"
        : "text-stone-400 group-hover:text-stone-600",
    );

  const getButtonClass = (path: string) =>
    cn(
      "w-10 h-10 rounded-full transition-all duration-200",
      isActive(path) ? "bg-amber-50" : "hover:bg-stone-50",
    );

  return (
    <header className="sticky top-0 left-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="flex items-center justify-between max-w-4xl w-full px-4 py-3 mx-auto">
        {/* 좌측: 모바일 메뉴 + 로고 */}
        <div className="flex items-center gap-3">
          {/* 모바일 햄버거 메뉴 */}
          <MobileNavSheet />

          <Link
            href={PATHS.HOME}
            className="transition-opacity hover:opacity-80"
          >
            <Logo />
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav
            className="hidden md:flex items-center gap-1 ml-6"
            aria-label="메인 메뉴"
          >
            {/* 1. 도서 검색 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className={getButtonClass(PATHS.BOOK_SEARCH)}
                    aria-label="도서 검색"
                  >
                    <Link href={PATHS.BOOK_SEARCH} className="group">
                      <Search className={getIconClass(PATHS.BOOK_SEARCH)} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>도서 검색</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-3 bg-stone-200 mx-1" />

            <div className="w-px h-3 bg-stone-200 mx-1" />

            {/* 2. 독서 기록 (로그인 전용) - 우선 순위 조정 */}
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className={getButtonClass(PATHS.READING_LOG)}
                      aria-label="독서 기록"
                    >
                      <Link href={PATHS.READING_LOG} className="group">
                        <CalendarDays
                          className={getIconClass(PATHS.READING_LOG)}
                        />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>나의 독서 기록</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* 3. 중고마켓 그룹 */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10 rounded-full transition-all duration-200",
                    isActive(PATHS.BOOK_MARKET)
                      ? "bg-amber-50"
                      : "hover:bg-stone-50",
                  )}
                  aria-label="중고마켓 메뉴"
                >
                  <Store
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive(PATHS.BOOK_MARKET)
                        ? "text-amber-600 fill-amber-100"
                        : "text-stone-400 hover:text-stone-600",
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 p-1">
                <DropdownMenuLabel className="text-xs text-stone-400 font-normal ml-1">
                  중고마켓
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-stone-100" />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href={PATHS.BOOK_MARKET}
                      className="flex items-center gap-2 cursor-pointer py-2 focus:bg-stone-50"
                    >
                      <Store className="w-4 h-4 mr-1 text-stone-500" />
                      <span className="font-medium text-stone-700">
                        마켓 홈
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {user && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.BOOK_SALES_REGISTER}
                          className="flex items-center gap-2 cursor-pointer py-2 focus:bg-stone-50"
                        >
                          <PenSquare className="w-4 h-4 mr-1 text-stone-500" />
                          <span className="font-medium text-stone-700">
                            판매글 쓰기
                          </span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.MY_PAGE_SALES}
                          className="flex items-center gap-2 cursor-pointer py-2 focus:bg-stone-50"
                        >
                          <ShoppingBag className="w-4 h-4 mr-1 text-stone-500" />
                          <span className="font-medium text-stone-700">
                            내 판매글
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 3. 리뷰 그룹 */}
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-10 h-10 rounded-full transition-all duration-200",
                    isActive(PATHS.REVIEWS)
                      ? "bg-amber-50"
                      : "hover:bg-stone-50",
                  )}
                  aria-label="리뷰 메뉴"
                >
                  <MessageSquareQuote
                    className={cn(
                      "w-5 h-5 transition-colors duration-200",
                      isActive(PATHS.REVIEWS)
                        ? "text-amber-600 fill-amber-100"
                        : "text-stone-400 hover:text-stone-600",
                    )}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48 p-1">
                <DropdownMenuLabel className="text-xs text-stone-400 font-normal ml-1">
                  도서 리뷰
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-stone-100" />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href={PATHS.REVIEWS}
                      className="flex items-center gap-2 cursor-pointer py-2 focus:bg-stone-50"
                    >
                      <List className="w-4 h-4 mr-1 text-stone-500" />
                      <span className="font-medium text-stone-700">
                        리뷰 피드
                      </span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                {user && (
                  <>
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.REVIEW_WRITE}
                          className="flex items-center gap-2 cursor-pointer py-2 focus:bg-stone-50"
                        >
                          <PenLine className="w-4 h-4 mr-1 text-stone-500" />
                          <span className="font-medium text-stone-700">
                            리뷰 작성
                          </span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.MY_REVIEWS}
                          className="flex items-center gap-2 cursor-pointer py-2 focus:bg-stone-50"
                        >
                          <User className="w-4 h-4 mr-1 text-stone-500" />
                          <span className="font-medium text-stone-700">
                            내가 쓴 리뷰
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-3 bg-stone-200 mx-1" />

            {/* 4. 인사이트 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className={getButtonClass(PATHS.INSIGHTS)}
                    aria-label="인사이트"
                  >
                    <Link href={PATHS.INSIGHTS} className="group">
                      <BarChart3 className={getIconClass(PATHS.INSIGHTS)} />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>독서 인사이트</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </div>

        {/* 우측: 사용자 메뉴 */}
        <div className="flex items-center">
          <UserPopover />
        </div>
      </div>
    </header>
  );
};
