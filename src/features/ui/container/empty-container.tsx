"use client";

import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { ReactNode } from "react";
import { Button, IButtonProps } from "../button/button";

type IEmptyPageProps = {
  emptyText: string;
  icon?: ReactNode;
  button?: Omit<IButtonProps, "variant" | "type" | "clicked"> & {
    clicked: NonNullable<IButtonProps["clicked"]>;
  };
} & IPropsWithClassName;

export function EmptyPage({
  className = "",
  emptyText,
  button,
  icon,
}: IEmptyPageProps) {
  return (
    <div
      className={
        "flex flex-col gap-6 text-text-muted items-center " + className
      }
    >
      {icon && <div className="text-7xl border-4 p-2 rounded-full">{icon}</div>}

      <p>{emptyText}</p>

      {button && (
        <Button
          {...button}
          type="button"
          clicked={button.clicked}
          variant="primary"
        >
          {button.buttonContent}
        </Button>
      )}
    </div>
  );
}
