import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAuthStore } from "@/features/auth/stores/use-auth-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/shadcn/sheet";
import { Link, usePathname } from "@/shared/config/i18n/routing";
import { PATHS } from "@/shared/constants/paths";
import { cn } from "@/shared/utils/cn";

import { LanguageSwitcher } from "../common/language-switcher";
import { Logo } from "../common/logo";

interface NavItem {
  href: string;
  label: string;
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  const isActive = (path: string) => pathname?.startsWith(path);

  // 네비게이션 섹션 정의
  const navSections: NavSection[] = [
    {
      title: tSheet("book"),
      items: [
        {
          href: PATHS.BOOK_SEARCH,
          label: t("book_search"),
        },
        {
          href: PATHS.READING_LOG,
          label: t("reading_log"),
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
        },
        {
          href: PATHS.BOOK_SALES_REGISTER,
          label: t("write_sales"),
          requiresAuth: true,
        },
        {
          href: PATHS.MY_PAGE_SALES,
          label: t("my_sales"),
          requiresAuth: true,
        },
      ],
    },
    {
      title: tSheet("review"),
      items: [
        {
          href: PATHS.REVIEWS,
          label: t("review_feed"),
        },
        {
          href: PATHS.REVIEW_WRITE,
          label: t("write_review"),
          requiresAuth: true,
        },
        {
          href: PATHS.MY_REVIEWS,
          label: t("my_reviews"),
          requiresAuth: true,
        },
      ],
    },
    {
      title: tSheet("stats"),
      items: [
        {
          href: PATHS.INSIGHTS,
          label: t("insights"),
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
        <button
          className="md:hidden p-2 -mr-2 text-stone-600 hover:text-stone-900 transition-colors"
          aria-label={t("menu_open")}
        >
          <Menu className="w-6 h-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] p-0 border-r border-stone-100 bg-white"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-stone-50 px-6 py-5">
          <SheetTitle className="flex items-center text-left" asChild>
            <div onClick={handleLinkClick}>
              <Logo />
            </div>
          </SheetTitle>
          <LanguageSwitcher className="mr-8" />
        </SheetHeader>

        <nav className="flex flex-col gap-8 p-6 overflow-y-auto h-[calc(100vh-80px)]">
          {navSections.map((section) => {
            // 인증이 필요한 아이템만 있는 섹션은 로그인 시에만 표시
            const visibleItems = section.items.filter(
              (item) => !item.requiresAuth || user,
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={cn(
                        "block py-2.5 px-4 text-base transition-all duration-200 rounded-lg",
                        isActive(item.href)
                          ? "bg-stone-100 font-bold text-stone-900"
                          : "text-stone-500 font-medium hover:bg-stone-50 hover:text-stone-900",
                      )}
                    >
                      {item.label}
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
