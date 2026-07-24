"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export type SearchMode = "KEYWORD" | "AI";

interface SearchModeTabsProps {
  activeMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
}

export const SearchModeTabs = ({
  activeMode,
  onModeChange,
}: SearchModeTabsProps) => {
  const t = useTranslations("book.search");

  return (
    <div className="flex justify-center mb-6">
      <div className="inline-flex p-1.5 bg-stone-100/80 rounded-full border border-stone-200/60 shadow-inner">
        <button
          type="button"
          onClick={() => onModeChange("KEYWORD")}
          className={`relative px-5 py-2 text-sm font-medium transition-colors duration-200 rounded-full select-none cursor-pointer ${
            activeMode === "KEYWORD"
              ? "text-stone-900 font-semibold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {activeMode === "KEYWORD" && (
            <motion.div
              layoutId="activeSearchTab"
              className="absolute inset-0 bg-white rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t("tab_keyword")}</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange("AI")}
          className={`relative px-5 py-2 text-sm font-medium transition-colors duration-200 rounded-full select-none cursor-pointer ${
            activeMode === "AI"
              ? "text-stone-900 font-semibold"
              : "text-stone-500 hover:text-stone-800"
          }`}
        >
          {activeMode === "AI" && (
            <motion.div
              layoutId="activeSearchTab"
              className="absolute inset-0 bg-white rounded-full shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t("tab_ai")}</span>
        </button>
      </div>
    </div>
  );
};
