"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

type ITitleProps = { title?: string } & PropsWithChildren & PropsWithClassName;

export function Title({ children, title, className = "" }: ITitleProps) {
  const titleContent = children ? children : title;

  return (
    <h1 className={"text-2xl font-bold text-text " + className}>
      {titleContent}
    </h1>
  );
}
