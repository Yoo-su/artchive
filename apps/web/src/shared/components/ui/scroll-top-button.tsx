"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/shadcn/button";

export const ScrollTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1, y: -5 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-white/70 dark:bg-black/50 backdrop-blur-md hover:bg-white/90 dark:hover:bg-black/70 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50 transition-all"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-5 w-5" />
            <span className="sr-only">맨 위로 스크롤</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
