"use client";

import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/shared/utils/index";

export interface InfiniteImageItem {
  id: string | number;
  image: string;
  title?: string;
  price?: number;
  author?: string;
  city?: string;
  district?: string;
}

export const INFINITE_IMAGE_FIELD_IMAGES: string[] = [
  "https://plus.unsplash.com/premium_photo-1665311515452-a9f54c4266c9?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=560&fit=crop&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=560&fit=crop&q=80",
];

export interface InfiniteImageFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  className?: string;
  items?: InfiniteImageItem[];
  images?: string[];
  imageWidth?: number;
  imageHeight?: number;
  gap?: number;
  maxSpeed?: number;
  smoothing?: number;
  borderRadius?: number;
  onItemClick?: (item: InfiniteImageItem, index: number) => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (r <= 0) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    return;
  }
  const clampedR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + clampedR, y);
  ctx.lineTo(x + w - clampedR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + clampedR);
  ctx.lineTo(x + w, y + h - clampedR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - clampedR, y + h);
  ctx.lineTo(x + clampedR, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - clampedR);
  ctx.lineTo(x, y + clampedR);
  ctx.quadraticCurveTo(x, y, x + clampedR, y);
  ctx.closePath();
}

export function InfiniteImageField({
  className,
  items,
  images,
  imageWidth = 180,
  imageHeight = 250,
  gap = 24,
  maxSpeed = 4,
  smoothing = 0.06,
  borderRadius = 0,
  onItemClick,
  ...rest
}: InfiniteImageFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const activeItemsRef = useRef<InfiniteImageItem[]>([]);
  const dimsRef = useRef({ w: 0, h: 0 });
  const camRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const isInsideRef = useRef(false);
  const rafRef = useRef<number>(0);

  // Normalize image data (support either items object or string array)
  const normalizedItems: InfiniteImageItem[] = (
    items && items.length > 0
      ? items
      : (images || INFINITE_IMAGE_FIELD_IMAGES).map((url, idx) => ({
          id: idx,
          image: url,
        }))
  ).filter((item) => Boolean(item.image));

  // If few items (e.g. 1~15 items in DB), safely repeat so the 2D grid distributes them organically
  const safeItems: InfiniteImageItem[] =
    normalizedItems.length > 0
      ? normalizedItems.length < 16
        ? Array.from(
            { length: Math.ceil(16 / normalizedItems.length) },
            () => normalizedItems
          ).flat()
        : normalizedItems
      : [{ id: 0, image: "/images/placeholder-image.svg" }];

  activeItemsRef.current = safeItems;

  // Pre-load images
  useEffect(() => {
    const imgs = safeItems.map((item) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = item.image;
      return img;
    });
    loadedImagesRef.current = imgs;
  }, [safeItems.map((i) => i.image).join(",")]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w: W, h: H } = dimsRef.current;
    if (W === 0 || H === 0) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cellW = imageWidth + gap;
    const cellH = imageHeight + gap;
    const imgs = loadedImagesRef.current;
    const numImages = Math.max(imgs.length, 1);

    // Physics — cursor offset from center drives velocity
    const tx = isInsideRef.current
      ? (mouseRef.current.x - 0.5) * 2 * maxSpeed
      : 0;
    const ty = isInsideRef.current
      ? (mouseRef.current.y - 0.5) * 2 * maxSpeed
      : 0;

    velRef.current.x += (tx - velRef.current.x) * smoothing;
    velRef.current.y += (ty - velRef.current.y) * smoothing;

    camRef.current.x += velRef.current.x;
    camRef.current.y += velRef.current.y;

    const camX = camRef.current.x;
    const camY = camRef.current.y;

    ctx.clearRect(0, 0, W, H);

    // Compute visible cell range
    const colMin = Math.floor((camX - W / 2) / cellW) - 1;
    const colMax = Math.ceil((camX + W / 2) / cellW) + 1;
    const rowMin = Math.floor((camY - H / 2) / cellH) - 1;
    const rowMax = Math.ceil((camY + H / 2) / cellH) + 1;

    for (let row = rowMin; row <= rowMax; row++) {
      for (let col = colMin; col <= colMax; col++) {
        // Top-left corner in screen space
        const sx = col * cellW - camX + W / 2 - imageWidth / 2;
        const sy = row * cellH - camY + H / 2 - imageHeight / 2;

        // Deterministic image assignment — same cell always gets same image
        const imgIdx =
          Math.abs(col * 7 + row * 13 + ((col * row * 3) | 0)) % numImages;
        const img = imgs[imgIdx];
        const item = activeItemsRef.current[imgIdx];

        // Draw Book Cover Image (Clean, no heavy blur shadows or flickering gradients)
        ctx.save();
        drawRoundedRect(ctx, sx, sy, imageWidth, imageHeight, borderRadius);
        ctx.clip();

        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, sx, sy, imageWidth, imageHeight);
        } else {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          ctx.fillRect(sx, sy, imageWidth, imageHeight);
        }
        ctx.restore();

        // Subtle crisp border outline
        ctx.save();
        drawRoundedRect(ctx, sx, sy, imageWidth, imageHeight, borderRadius);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [imageWidth, imageHeight, gap, maxSpeed, smoothing, borderRadius]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      dimsRef.current = { w: rect.width, h: rect.height };
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };

    const onEnter = () => {
      isInsideRef.current = true;
    };
    const onLeave = () => {
      isInsideRef.current = false;
    };

    const onClick = (e: MouseEvent) => {
      if (!onItemClick) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const { w: W, h: H } = dimsRef.current;
      const cellW = imageWidth + gap;
      const cellH = imageHeight + gap;
      const camX = camRef.current.x;
      const camY = camRef.current.y;
      const numImages = Math.max(activeItemsRef.current.length, 1);

      const col = Math.round((clickX + camX - W / 2) / cellW);
      const row = Math.round((clickY + camY - H / 2) / cellH);

      const sx = col * cellW - camX + W / 2 - imageWidth / 2;
      const sy = row * cellH - camY + H / 2 - imageHeight / 2;

      if (
        clickX >= sx &&
        clickX <= sx + imageWidth &&
        clickY >= sy &&
        clickY <= sy + imageHeight
      ) {
        const imgIdx =
          Math.abs(col * 7 + row * 13 + ((col * row * 3) | 0)) % numImages;
        const item = activeItemsRef.current[imgIdx];
        if (item) {
          onItemClick(item, imgIdx);
        }
      }
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [draw, imageWidth, imageHeight, gap, onItemClick]);

  return (
    <div
      {...rest}
      className={cn(
        "relative w-full h-full overflow-hidden select-none",
        className
      )}
    >
      <canvas ref={canvasRef} className="block w-full h-full bg-transparent" />
    </div>
  );
}

