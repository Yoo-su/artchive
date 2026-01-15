"use client";

import { useEffect, useState } from "react";

import { Label } from "@/shared/components/shadcn/label";
import { Switch } from "@/shared/components/shadcn/switch";

import {
  useReadingLogSettingsQuery,
  useUpdateReadingLogSettingsMutation,
} from "../../queries";

export function ReadingLogHeader() {
  const { data: settings } = useReadingLogSettingsQuery();
  const { mutate: updateSettings, isPending } =
    useUpdateReadingLogSettingsMutation();
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    if (settings) {
      setIsPublic(settings.isReadingLogPublic ?? true);
    }
  }, [settings]);

  const handleToggle = (checked: boolean) => {
    setIsPublic(checked);
    updateSettings(checked);
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">독서 기록</h1>
        <p className="text-muted-foreground">
          언제 어떤 책을 읽었는지 기록해보세요.
        </p>
      </div>

      <div className="flex items-center space-x-4 bg-secondary/30 p-3 rounded-lg border border-border/50">
        <Switch
          id="public-mode"
          checked={isPublic}
          disabled={isPending}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-blue-600"
        />
        <div className="flex flex-col w-[240px]">
          <Label htmlFor="public-mode" className="font-medium cursor-pointer">
            독서 기록 공개
          </Label>
          <span className="text-xs text-muted-foreground mt-0.5">
            {isPublic
              ? "다른 사용자가 내 기록을 볼 수 있습니다."
              : "나만 볼 수 있도록 비공개합니다."}
          </span>
        </div>
      </div>
    </div>
  );
}
