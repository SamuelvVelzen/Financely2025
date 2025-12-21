import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";

type ITextWithTooltipProps = {
  title?: string;
  children?: string | null;
} & IPropsWithClassName;

export function TextWithTooltip({
  title,
  children,
  className,
}: ITextWithTooltipProps) {
  return (
    <span
      className={cn("truncate", className)}
      title={title ?? children ?? undefined}>
      {children}
    </span>
  );
}
