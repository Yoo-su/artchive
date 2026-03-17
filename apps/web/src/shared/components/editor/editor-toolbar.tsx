"use client";

import { type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/shared/components/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/shadcn/popover";
import { Separator } from "@/shared/components/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/shadcn/tooltip";
import { cn } from "@/shared/utils/cn";

interface EditorToolbarProps {
  editor: Editor;
  onImageAdd?: () => void;
}

export const EditorToolbar = ({ editor, onImageAdd }: EditorToolbarProps) => {
  // 에디터 상태 변경 시 리렌더링 강제
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => forceUpdate({});

    editor.on("transaction", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    editor.on("update", handleUpdate);

    return () => {
      editor.off("transaction", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
      editor.off("update", handleUpdate);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const textStyleButtons = [
    {
      label: "Bold",
      icon: Bold,
      isActive: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "Italic",
      icon: Italic,
      isActive: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "Underline",
      icon: Underline,
      isActive: editor.isActive("underline"),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "Strikethrough",
      icon: Strikethrough,
      isActive: editor.isActive("strike"),
      action: () => editor.chain().focus().toggleStrike().run(),
    },
  ];

  const headingButtons = [
    {
      label: "Heading 1",
      icon: Heading1,
      isActive: editor.isActive("heading", { level: 1 }),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      icon: Heading2,
      isActive: editor.isActive("heading", { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      isActive: editor.isActive("heading", { level: 3 }),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
  ];

  const alignButtons = [
    {
      label: "Align Left",
      icon: AlignLeft,
      isActive: editor.isActive({ textAlign: "left" }),
      action: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      label: "Align Center",
      icon: AlignCenter,
      isActive: editor.isActive({ textAlign: "center" }),
      action: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      label: "Align Right",
      icon: AlignRight,
      isActive: editor.isActive({ textAlign: "right" }),
      action: () => editor.chain().focus().setTextAlign("right").run(),
    },
  ];

  const listButtons = [
    {
      label: "Bullet List",
      icon: List,
      isActive: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Ordered List",
      icon: ListOrdered,
      isActive: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Blockquote",
      icon: Quote,
      isActive: editor.isActive("blockquote"),
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Code Block",
      icon: Code,
      isActive: editor.isActive("codeBlock"),
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
  ];

  const colors = [
    "#000000",
    "#495057",
    "#868E96",
    "#ADB5BD",
    "#FF0000",
    "#C92A2A",
    "#E64980",
    "#A61E4D",
    "#BE4BDB",
    "#862E9C",
    "#7950F2",
    "#5F3DC4",
    "#4C6EF5",
    "#364FC7",
    "#228BE6",
    "#1864AB",
    "#15AABF",
    "#0B7285",
    "#12B886",
    "#087F5B",
    "#40C057",
    "#2B8A3E",
    "#82C91E",
    "#FAB005",
    "#FD7E14",
  ];

  const highlightColors = [
    "#F8F9FA",
    "#E9ECEF",
    "#DEE2E6",
    "#CED4DA",
    "#FFF5F5",
    "#FFE3E3",
    "#FFF0F6",
    "#FFDEEB",
    "#F8F0FC",
    "#F3D9FA",
    "#F3F0FF",
    "#E5DBFF",
    "#EDF2FF",
    "#DBE4FF",
    "#E7F5FF",
    "#D0EBFF",
    "#E3FAFC",
    "#C5F6FA",
    "#E6FCF5",
    "#C3FAE8",
    "#EBFBEE",
    "#D3F9D8",
    "#F4FCE3",
    "#FFF9DB",
    "#FFF4E6",
  ];

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL을 입력하세요", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border-b bg-muted/40 p-2 flex flex-wrap gap-1 sticky top-0 z-10 items-center">
      {/* 텍스트 스타일 */}
      <div className="flex items-center gap-1">
        {textStyleButtons.map((btn) => (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={btn.action}
                className={cn(
                  "h-8 w-8 p-0",
                  btn.isActive && "bg-muted text-primary"
                )}
                aria-label={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{btn.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 헤딩 */}
      <div className="flex items-center gap-1">
        {headingButtons.map((btn) => (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={btn.action}
                className={cn(
                  "h-8 w-8 p-0",
                  btn.isActive && "bg-muted text-primary"
                )}
                aria-label={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{btn.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 정렬 */}
      <div className="flex items-center gap-1">
        {alignButtons.map((btn) => (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={btn.action}
                className={cn(
                  "h-8 w-8 p-0",
                  btn.isActive && "bg-muted text-primary"
                )}
                aria-label={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{btn.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 리스트 & 블록 */}
      <div className="flex items-center gap-1">
        {listButtons.map((btn) => (
          <Tooltip key={btn.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={btn.action}
                className={cn(
                  "h-8 w-8 p-0",
                  btn.isActive && "bg-muted text-primary"
                )}
                aria-label={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{btn.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 색상 */}
      <div className="flex items-center gap-1">
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive("textStyle") && "bg-muted"
                  )}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Text Color</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1 flex-wrap max-w-[150px]">
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-7"
                onClick={() => editor.chain().focus().unsetColor().run()}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    editor.isActive("highlight") && "bg-muted"
                  )}
                >
                  <Highlighter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Highlight Color</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-auto p-2">
            <div className="flex gap-1 flex-wrap max-w-[150px]">
              {highlightColors.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() =>
                    editor.chain().focus().toggleHighlight({ color }).run()
                  }
                  className="w-6 h-6 rounded-md border"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-7"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 삽입 */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Horizontal Rule</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={setLink}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("link") && "bg-muted text-primary"
              )}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Link</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 이미지 */}
      {onImageAdd && (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onImageAdd}
                className="h-8 w-8 p-0"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Image</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
