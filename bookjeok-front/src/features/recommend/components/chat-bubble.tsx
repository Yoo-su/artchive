import { HTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/shared/utils/cn";

interface ChatBubbleProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  isAi?: boolean;
}

export function ChatBubble({
  message,
  isAi = false,
  className,
  ...props
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full items-end gap-2 text-sm",
        isAi ? "justify-start" : "justify-end",
        "animate-slide-up",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-5 py-3.5 leading-relaxed shadow-sm transition-all text-[15px] wrap-break-word",
          isAi
            ? "rounded-tl-none bg-white text-[#5D4037] border border-[#C8E6C9]"
            : "rounded-tr-none bg-[#66BB6A] text-white shadow-[#A5D6A7]",
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Style links to be visible
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="underline font-medium hover:text-current/80"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            // Style bold text
            strong: ({ node, ...props }) => (
              <strong
                {...props}
                className="font-bold border-b border-current/30"
              />
            ),
            // Ensure lists render properly
            ul: ({ node, ...props }) => (
              <ul {...props} className="list-disc pl-4 space-y-1 my-1" />
            ),
            ol: ({ node, ...props }) => (
              <ol {...props} className="list-decimal pl-4 space-y-1 my-1" />
            ),
            p: ({ node, ...props }) => (
              <p {...props} className="mb-1 last:mb-0" />
            ),
          }}
        >
          {message}
        </ReactMarkdown>
      </div>
    </div>
  );
}
