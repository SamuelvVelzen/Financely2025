"use client";

import { useEffect, useState } from "react";

// Track open dialogs and assign z-index values
let dialogStack: string[] = [];

export function useDialogStack(dialogId?: string) {
  const [zIndex, setZIndex] = useState(50);

  useEffect(() => {
    if (!dialogId) {
      setZIndex(50);
      return;
    }

    // Add dialog to stack if not already there
    if (!dialogStack.includes(dialogId)) {
      dialogStack.push(dialogId);
    }

    // Calculate z-index based on position in stack
    const index = dialogStack.indexOf(dialogId);
    // Base z-index is 50, each dialog adds 10
    // Overlay is always 1 less than dialog
    setZIndex(50 + index * 10);

    return () => {
      // Remove dialog from stack
      dialogStack = dialogStack.filter((id) => id !== dialogId);
    };
  }, [dialogId]);

  return zIndex;
}

