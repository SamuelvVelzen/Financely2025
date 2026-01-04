import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { PropsWithChildren } from "react";

type ITitleProps = { title?: string } & PropsWithChildren & IPropsWithClassName;

export function Title({ children, title, className = "" }: ITitleProps) {
  const titleContent = children ? children : title;

  return (
    <h1 className={cn("text-2xl font-bold text-text", className)}>
      {titleContent}
    </h1>
  );
}
