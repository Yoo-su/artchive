import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { SCENES } from "@/features/intro/constants";

import { RecordScene } from "./record-scene";
import { ReviewScene } from "./review-scene";
import { ScrollGuide } from "./scroll-guide";
import { UsedScene } from "./used-scene";

// -----------------------------------------------------------------------------
// 컴포넌트: 홈 히어로 (HomeHero)
// -----------------------------------------------------------------------------
export const HomeHero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScene = SCENES[currentIndex];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCENES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative flex min-h-[600px] w-full flex-col justify-center overflow-hidden bg-white md:min-h-[750px]">
      <div className="container relative mx-auto flex-1 w-full px-6 md:px-10">
        <AnimatePresence mode="wait">
          {currentScene.id === "record" && (
            <RecordScene key="record" data={currentScene} />
          )}
          {currentScene.id === "used" && (
            <UsedScene key="used" data={currentScene} />
          )}
          {currentScene.id === "review" && (
            <ReviewScene key="review" data={currentScene} />
          )}
        </AnimatePresence>
      </div>

      {/* Visual Connector: The Kinetic Thread */}
      <ScrollGuide />
    </section>
  );
};
