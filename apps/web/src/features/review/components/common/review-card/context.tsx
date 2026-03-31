"use client";

import { Review } from "@bookjeok/core";
import { createContext, useContext } from "react";

interface ReviewCardContextValue {
  review: Review;
  priority?: boolean;
}

export const ReviewCardContext = createContext<ReviewCardContextValue | null>(
  null,
);

export const useReviewCardContext = () => {
  const context = useContext(ReviewCardContext);
  if (!context) {
    throw new Error(
      "useReviewCardContext must be used within a ReviewCard.Root",
    );
  }
  return context;
};
