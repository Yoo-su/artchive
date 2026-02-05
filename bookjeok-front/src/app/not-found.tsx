import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/components/shadcn/button";

// Global 404 Page (No Locale)
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50/50 px-4 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10" />

      <div className="z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-8 scale-125">
          <Link
            href="/"
            className="inline-block group cursor-pointer"
            aria-label="Home"
          >
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-square.svg"
                  alt="Bookjeok"
                  className="w-full h-full drop-shadow-sm"
                />
              </div>
              <div className="flex items-baseline leading-none tracking-tighter">
                <span className="text-[28px] font-bold text-stone-600 font-serif">
                  book
                </span>
                <div className="mx-0.5 flex items-end self-baseline">
                  <span className="text-[28px] font-bold text-stone-600 font-serif">
                    j
                  </span>
                </div>
                <span className="text-[28px] font-bold text-stone-600 font-serif -ml-px">
                  eok
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="space-y-6 max-w-md mx-auto p-12 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-stone-200/50">
          <div className="space-y-2">
            <h1 className="text-8xl font-serif font-bold text-stone-900/10 select-none">
              404
            </h1>
            <h2 className="text-2xl font-bold text-stone-800">
              Page Not Found
            </h2>
          </div>

          <p className="text-stone-600 leading-relaxed text-sm">
            The page you are looking for might have been removed or moved.
            <br />
            Please check the URL and try again.
          </p>

          <div className="pt-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-stone-900 hover:bg-stone-800 text-white shadow-lg shadow-stone-900/20 transition-all hover:-translate-y-0.5"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-stone-400 text-xs">
        © Bookjeok. All rights reserved.
      </div>
    </div>
  );
}
