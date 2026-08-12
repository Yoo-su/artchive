import { useEffect } from "react";

let lockCount = 0;
let originalOverflow = "";

export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalOverflow = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow || "";
      }
    };
  }, [isLocked]);
}
