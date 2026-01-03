"use client";

import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { IconType } from "react-icons";
import { Button, IButtonProps } from "../button/button";

type IEmptyPageProps = {
  emptyText: string;
  icon: IconType;
  button?: Omit<IButtonProps, "variant" | "type" | "clicked"> & {
    clicked: NonNullable<IButtonProps["clicked"]>;
  };
} & IPropsWithClassName;

export function EmptyPage({
  className = "",
  emptyText,
  button,
  icon: Icon,
}: IEmptyPageProps) {
  return (
    <div
      className={
        "flex flex-col gap-6 text-text-muted items-center " + className
      }>
      {Icon && (
        <div className="text-7xl border-4 p-2 rounded-full">
          <Icon className="size-10" />
        </div>
      )}

      <p className="text-center">{emptyText}</p>

      {button && (
        <Button
          {...button}
          type="button"
          clicked={button.clicked}
          variant="primary">
          {button.buttonContent}
        </Button>
      )}
    </div>
  );
}
