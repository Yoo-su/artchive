"use client";

import { useState } from "react";

import { ReadingLogCalendar } from "@/features/reading-log/components/calendar-view/reading-log-calendar";
import { ReadingLogHero } from "@/features/reading-log/components/common/reading-log-hero";

export function ReadingLogView() {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="relative min-h-screen pb-20">
      <ReadingLogHero currentDate={currentDate} />

      <div className="container relative z-10">
        <ReadingLogCalendar
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
      </div>
    </div>
  );
}
