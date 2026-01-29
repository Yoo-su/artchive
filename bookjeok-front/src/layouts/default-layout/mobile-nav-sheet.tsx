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
import { useTranslations } from "next-intl";
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
import { Link } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";

import { LanguageSwitcher } from "../common/language-switcher";
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
  const t = useTranslations("header.nav");
  const tSheet = useTranslations("sheet.sections");
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  // 네비게이션 섹션 정의
  const navSections: NavSection[] = [
    {
      title: tSheet("book"),
      items: [
        {
          href: PATHS.BOOK_SEARCH,
          label: t("book_search"),
          icon: <Search className="h-4 w-4" />,
        },
        {
          href: PATHS.READING_LOG,
          label: t("reading_log"),
          icon: <CalendarDays className="h-4 w-4" />,
          requiresAuth: true,
        },
      ],
    },
    {
      title: tSheet("market"),
      items: [
        {
          href: PATHS.BOOK_MARKET,
          label: t("market_home"),
          icon: <Store className="h-4 w-4" />,
        },
        {
          href: PATHS.BOOK_SALES_REGISTER,
          label: t("write_sales"),
          icon: <PenSquare className="h-4 w-4" />,
          requiresAuth: true,
        },
        {
          href: PATHS.MY_PAGE_SALES,
          label: t("my_sales"),
          icon: <ShoppingBag className="h-4 w-4" />,
          requiresAuth: true,
        },
      ],
    },
    {
      title: tSheet("review"),
      items: [
        {
          href: PATHS.REVIEWS,
          label: t("review_feed"), // Using "Review Feed" instead of "Review Home" to match
          icon: <List className="h-4 w-4" />,
        },
        {
          href: PATHS.REVIEW_WRITE,
          label: t("write_review"),
          icon: <PenLine className="h-4 w-4" />,
          requiresAuth: true,
        },
        {
          href: PATHS.MY_REVIEWS,
          label: t("my_reviews"),
          icon: <User className="h-4 w-4" />,
          requiresAuth: true,
        },
      ],
    },
    {
      title: tSheet("stats"),
      items: [
        {
          href: PATHS.INSIGHTS,
          label: t("insights"), // Using "Insights"
          icon: <BarChart3 className="h-4 w-4" />,
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
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-gray-100 px-4 py-3">
          <SheetTitle className="flex items-center text-left" asChild>
            <div onClick={handleLinkClick}>
              <Logo />
            </div>
          </SheetTitle>
          <LanguageSwitcher className="mr-8" />
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
