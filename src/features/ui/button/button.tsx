"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IButtonProps = {
  clicked: () => void;
} & PropsWithChildren &
  PropsWithClassName;

export default function Button({ children, className, clicked }: IButtonProps) {
  return (
    <button
      className={`hover:bg-surface-hover p-2 border border-border rounded-full ${className}`}
      onClick={() => clicked()}>
      {children}
    </button>
  );
}
