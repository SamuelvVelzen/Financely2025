"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren, useId, useRef, useState } from "react";
import { TabContext } from "./tab-context";

type ITabsProps = IPropsWithClassName &
  PropsWithChildren & {
    defaultValue: string;
  };

export function Tabs({
  defaultValue,
  children,
  className = "",
}: ITabsProps & PropsWithChildren) {
  const [value, setValue] = useState(defaultValue);
  const id = useId();
  const tabsRef = useRef<string[]>([]);

  const registerTab = (value: string) => {
    if (!tabsRef.current.includes(value)) {
      tabsRef.current.push(value);
    }
  };

  const getTabs = () => tabsRef.current;

  return (
    <TabContext.Provider value={{ value, setValue, id, registerTab, getTabs }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabContext.Provider>
  );
}
