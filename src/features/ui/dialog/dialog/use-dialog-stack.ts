"use client";

import { useEffect, useState } from "react";

// Track open dialogs and assign z-index values
let dialogStack: string[] = [];

export function useDialogStack(dialogId?: string) {
  const [zIndex, setZIndex] = useState(100);

  useEffect(() => {
    if (!dialogId) {
      setZIndex(100);
      return;
    }

    // Add dialog to stack if not already there
    if (!dialogStack.includes(dialogId)) {
      dialogStack.push(dialogId);
    }

    // Calculate z-index based on position in stack
    const index = dialogStack.indexOf(dialogId);
    // Base z-index is 100, each dialog adds 20 (room for nested dropdowns at +5)
    // Overlay is always 1 less than dialog
    setZIndex(100 + index * 20);

    return () => {
      // Remove dialog from stack
      dialogStack = dialogStack.filter((id) => id !== dialogId);
    };
  }, [dialogId]);

  return zIndex;
}

