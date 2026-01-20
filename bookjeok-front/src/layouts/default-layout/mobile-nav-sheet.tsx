"use client";

import {
  BarChart3,
  CalendarDays,
  List,
  Menu,
  PenLine,
  PenSquare,
  Search,
  ShoppingBag,
  Store,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import { Button } from "@/shared/components/shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/shadcn/sheet";
import { PATHS } from "@/shared/constants/paths";

import { Logo } from "../common/logo";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * 모바일 네비게이션 Sheet 컴포넌트
 */
export const MobileNavSheet = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  // 네비게이션 섹션 정의
  const navSections: NavSection[] = [
    {
      title: "도서",
      items: [
        {
          href: PATHS.BOOK_SEARCH,
          label: "도서 검색",
          icon: <Search className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "중고마켓",
      items: [
        {
          href: PATHS.BOOK_MARKET,
          label: "중고마켓 홈",
          icon: <Store className="h-4 w-4" />,
        },
        {
          href: PATHS.BOOK_SALES_REGISTER,
          label: "판매글 작성",
          icon: <PenSquare className="h-4 w-4" />,
          requiresAuth: true,
        },
        {
          href: PATHS.MY_PAGE_SALES,
          label: "내 판매글",
          icon: <ShoppingBag className="h-4 w-4" />,
          requiresAuth: true,
        },
      ],
    },
    {
      title: "리뷰",
      items: [
        {
          href: PATHS.REVIEWS,
          label: "리뷰 홈",
          icon: <List className="h-4 w-4" />,
        },
        {
          href: PATHS.REVIEW_WRITE,
          label: "리뷰 작성",
          icon: <PenLine className="h-4 w-4" />,
          requiresAuth: true,
        },
        {
          href: PATHS.MY_REVIEWS,
          label: "내가 쓴 리뷰",
          icon: <User className="h-4 w-4" />,
          requiresAuth: true,
        },
      ],
    },
    {
      title: "통계",
      items: [
        {
          href: PATHS.INSIGHTS,
          label: "서비스 인사이트",
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "나의 활동",
      items: [
        {
          href: PATHS.READING_LOG,
          label: "독서 기록",
          icon: <CalendarDays className="h-4 w-4" />,
          requiresAuth: true,
        },
      ],
    },
  ];

  const handleLinkClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full cursor-pointer text-gray-600 hover:text-gray-900"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b border-gray-100 px-4 py-3">
          <SheetTitle className="flex items-center text-left" asChild>
            <div onClick={handleLinkClick}>
              <Logo />
            </div>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-4">
          {navSections.map((section) => {
            // 인증이 필요한 아이템만 있는 섹션은 로그인 시에만 표시
            const visibleItems = section.items.filter(
              (item) => !item.requiresAuth || user,
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-4">
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};
