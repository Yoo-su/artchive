"use client";

import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/shadcn/button";
import { cn } from "@/shared/utils/cn";

interface BookSaleImageCarouselProps {
  images: string[];
  alt: string;
}

const ONE_SECOND = 1000;
const AUTO_DELAY = ONE_SECOND * 4;
const DRAG_BUFFER = 50;

const SPRING_OPTIONS = {
  type: "spring",
  mass: 3,
  stiffness: 400,
  damping: 50,
} as const;

export const BookSaleImageCarousel = ({
  images,
  alt,
}: BookSaleImageCarouselProps) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dragX = useMotionValue(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const intervalRef = setInterval(() => {
      const x = dragX.get();

      if (x === 0 && !dragging) {
        setImgIndex((pv) => {
          if (pv === images.length - 1) {
            return 0;
          }
          return pv + 1;
        });
      }
    }, AUTO_DELAY);

    return () => clearInterval(intervalRef);
  }, [dragX, dragging, images.length]);

  const onDragStart = () => {
    setDragging(true);
  };

  const onDragEnd = () => {
    setDragging(false);

    const x = dragX.get();

    if (x <= -DRAG_BUFFER && imgIndex < images.length - 1) {
      setImgIndex((pv) => pv + 1);
    } else if (x >= DRAG_BUFFER && imgIndex > 0) {
      setImgIndex((pv) => pv - 1);
    }
  };

  const goToPrevious = () => {
    setImgIndex((pv) => (pv === 0 ? images.length - 1 : pv - 1));
  };

  const goToNext = () => {
    setImgIndex((pv) => (pv === images.length - 1 ? 0 : pv + 1));
  };

  if (!images.length) return null;

  return (
    <div className="relative group overflow-hidden bg-stone-100 rounded-xl aspect-square w-full">
      <motion.div
        drag="x"
        dragConstraints={{
          left: 0,
          right: 0,
        }}
        style={{
          x: dragX,
        }}
        animate={{
          translateX: `-${imgIndex * 100}%`,
        }}
        transition={SPRING_OPTIONS}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex cursor-grab items-center active:cursor-grabbing h-full"
      >
        {images.map((imgSrc, idx) => (
          <ImageItem key={idx} imgSrc={imgSrc} alt={`${alt} - ${idx + 1}`} />
        ))}
      </motion.div>

      {/* Navigation Buttons (Visible on Hover/Mobile) */}
      {images.length > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-sm"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-sm shadow-sm"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setImgIndex(idx)}
              className={cn(
                "h-2 w-2 rounded-full transition-all shadow-sm",
                idx === imgIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/80",
              )}
            />
          ))}
        </div>
      )}

      {/* Image Counter Badge */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 text-xs font-medium rounded-full pointer-events-none z-10">
        {imgIndex + 1} / {images.length}
      </div>
    </div>
  );
};

const ImageItem = ({ imgSrc, alt }: { imgSrc: string; alt: string }) => {
  return (
    <motion.div className="w-full shrink-0 h-full relative overflow-hidden bg-stone-200">
      {/* Background Blurred Image */}
      <div className="absolute inset-0">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-cover blur-xl scale-110 opacity-60"
          draggable={false}
          priority
        />
      </div>
      {/* Main Image */}
      <div className="relative h-full w-full">
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className="object-contain"
          draggable={false}
          priority
        />
      </div>
    </motion.div>
  );
};
