import { cn } from "@/util/cn";
import { createLink, LinkComponentProps } from "@tanstack/react-router";
import * as React from "react";

interface IBasicLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  // Add any additional props you want to pass to the anchor element
}

const BasicLinkComponent = React.forwardRef<HTMLAnchorElement, IBasicLinkProps>(
  ({ className, ...props }, ref) => {
    return <a ref={ref} {...props} className={cn(className)} />;
  }
);

export const BaseLink = createLink(BasicLinkComponent);

export type IBaseLinkProps = LinkComponentProps<typeof BasicLinkComponent>;
