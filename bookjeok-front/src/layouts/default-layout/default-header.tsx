"use client";

import {
  BarChart3,
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

import { Logo } from "../common/logo";
import { MobileNavSheet } from "./mobile-nav-sheet";
import UserPopover from "./user-popover";

export const DefaultHeader = () => {
  const { user } = useAuthStore();
  return (
    <header className="sticky top-0 left-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between max-w-4xl w-full px-4 py-3 mx-auto">
        {/* 좌측: 모바일 메뉴 + 로고 */}
        <div className="flex items-center gap-2">
          {/* 모바일 햄버거 메뉴 */}
          <MobileNavSheet />

          <Link href={PATHS.HOME}>
            <Logo />
          </Link>

          {/* 데스크탑 네비게이션 (md 이상에서만 표시) */}
          <nav
            className="hidden md:flex items-center gap-1 ml-2"
            aria-label="메인 메뉴"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
                    aria-label="도서 검색 페이지로 이동"
                  >
                    <Link href={PATHS.BOOK_SEARCH}>
                      <Search className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>도서 검색</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
                  aria-label="중고마켓 메뉴 열기"
                >
                  <Store className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuLabel>중고마켓</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href={PATHS.BOOK_MARKET}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Store className="w-4 h-4 mr-2" />
                      <span>중고마켓 홈</span>
                    </Link>
                  </DropdownMenuItem>
                  {user && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.BOOK_SALES_REGISTER}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <PenSquare className="w-4 h-4 mr-2" />
                          <span>판매글 작성</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.MY_PAGE_SALES}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          <span>내 판매글</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
                  aria-label="리뷰 메뉴 열기"
                >
                  <MessageSquareQuote className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-40">
                <DropdownMenuLabel>리뷰</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href={PATHS.REVIEWS}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <List className="w-4 h-4 mr-2" />
                      <span>리뷰 홈</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                {user && (
                  <>
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.REVIEW_WRITE}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <PenLine className="w-4 h-4 mr-2" />
                          <span>리뷰 작성</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={PATHS.MY_REVIEWS}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <User className="w-4 h-4 mr-2" />
                          <span>내가 쓴 리뷰</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 인사이트 링크 */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
                    aria-label="서비스 인사이트 페이지로 이동"
                  >
                    <Link href={PATHS.INSIGHTS}>
                      <BarChart3 className="w-5 h-5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>서비스 인사이트</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>
        </div>

        {/* 우측: 사용자 정보 */}
        <div className="flex items-center">
          <UserPopover />
        </div>
      </div>
    </header>
  );
};
