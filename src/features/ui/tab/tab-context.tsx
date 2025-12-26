"use client";

import { createContext, useContext } from "react";

interface ITabContext {
  value: string;
  setValue: (value: string) => void;
  id: string;
  registerTab: (value: string) => void;
  getTabs: () => string[];
  goNext: () => void;
  goBack: () => void;
}

export const TabContext = createContext<ITabContext | null>(null);

export function useTabContext() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("Tab components must be used within a TabGroup component");
  }
  return context;
}

