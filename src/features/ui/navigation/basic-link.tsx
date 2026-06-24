import { cn } from "@/features/util/cn";
import * as React from "react";

type IBasicLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const BasicLinkComponent = React.forwardRef<
  HTMLAnchorElement,
  IBasicLinkProps
>(({ className, children, ...props }, ref) => {
  return (
    <a
      ref={ref}
      {...props}
      className={cn(className)}>
      {children}
    </a>
  );
});

BasicLinkComponent.displayName = "BasicLinkComponent";
