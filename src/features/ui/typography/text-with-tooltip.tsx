import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { PropsWithChildren } from "react";

type ITextWithTooltipProps = {
  title?: string;
  children: string;
} & PropsWithChildren &
  IPropsWithClassName;

export function TextWithTooltip({
  title,
  children,
  className,
}: ITextWithTooltipProps) {
  return (
    <span className={cn("truncate", className)} title={title ?? children}>
      {children}
    </span>
  );
}
