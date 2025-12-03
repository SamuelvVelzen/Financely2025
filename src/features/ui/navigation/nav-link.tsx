import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { BaseLink, IBaseLinkProps } from "./base-link";

type ILinkItem = {} & IBaseLinkProps & IPropsWithClassName;

export function NavLink({ className, children, ...props }: ILinkItem) {
  const baseClasses = "text-primary hover:underline";

  return (
    <BaseLink className={cn(baseClasses, className)} {...props}>
      {children}
    </BaseLink>
  );
}
