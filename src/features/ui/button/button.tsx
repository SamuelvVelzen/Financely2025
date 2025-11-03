"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

export type IButtonProps = {
  clicked: () => void;
  buttonContent?: string | React.ReactNode;
} & PropsWithChildren &
  PropsWithClassName;

export function Button({
  buttonContent,
  className,
  clicked,
  children,
}: IButtonProps) {
  return (
    <button
      className={`hover:bg-surface-hover p-2 border border-border rounded-full ${className}`}
      onClick={() => clicked()}>
      {buttonContent ?? children}
    </button>
  );
}
