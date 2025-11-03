"use client";

import { PropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren, ReactNode } from "react";
import { Button } from "./button";

type IIconButton = {
  icon?: ReactNode;
  // clicked: IButtonProps["clicked"];
} & PropsWithChildren &
  PropsWithClassName;

export function IconButton({
  children,
  className,
  icon,
}: // clicked,
IIconButton) {
  const iconButtonContent = children ? children : icon;

  return (
    <Button
      className={` ${className}`}
      clicked={() => {}}
      buttonContent={iconButtonContent}
    />
  );
}
