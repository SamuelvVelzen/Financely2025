"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";

export type IButtonProps = {
  clicked: () => void;
  buttonContent: string | React.ReactNode;
} & PropsWithClassName;

export function Button({ buttonContent, className, clicked }: IButtonProps) {
  return (
    <button
      className={`hover:bg-surface-hover p-2 border border-border rounded-full ${className}`}
      onClick={() => clicked()}>
      {buttonContent}
    </button>
  );
}
