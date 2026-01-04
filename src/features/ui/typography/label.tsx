import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { LabelHTMLAttributes, forwardRef } from "react";

type ILabelProps = {
  htmlFor?: string;
  required?: boolean;
} & LabelHTMLAttributes<HTMLLabelElement> &
  IPropsWithClassName;

export const Label = forwardRef<HTMLLabelElement, ILabelProps>(
  ({ className = "", htmlFor, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={cn("text-sm font-medium text-text-muted", className)}
        {...props}>
        {children}
        {required && (
          <span className="text-danger ml-1 text-[0.5em] leading-none align-super">
            ●
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = "Label";
