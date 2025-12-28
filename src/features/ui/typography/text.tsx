import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";
import { IButtonSize } from "../button/button";

type ITextProps = {
  size?: IButtonSize;
  isMuted?: boolean;
} & IPropsWithClassName &
  PropsWithChildren;

export function Text({
  children,
  className,
  size = "md",
  isMuted = false,
}: ITextProps) {
  const sizeClasses: { [key in IButtonSize]: string } = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  return (
    <p
      className={cn(
        sizeClasses[size],
        isMuted ? "text-text-muted" : "text-text",
        className
      )}>
      {children}
    </p>
  );
}
