import { Spinner } from "@/features/ui/loading/spinner";
import { cn } from "@/features/util/cn";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  buttonHeightClasses,
  type IButtonSize,
} from "./button-size-classes";

export type { IButtonSize } from "./button-size-classes";

export type IVariant =
  | "default"
  | "danger"
  | "info"
  | "warning"
  | "success"
  | "primary";

export type IButtonProps = {
  buttonContent?: string | ReactNode;
  variant?: IVariant;
  disabled?: boolean;
  size?: IButtonSize;
  /** Accessible name for icon-only buttons */
  ariaLabel?: string;
  loading?:
    | boolean
    | {
        isLoading?: boolean;
        text?: string;
      };
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick" | "aria-label"> &
  (
    | {
        type?: "button";
        clicked: (event: React.MouseEvent<HTMLButtonElement>) => void;
      }
    | {
        type: "submit" | "reset";
        clicked?: never;
      }
  );

export const Button = forwardRef<HTMLButtonElement, IButtonProps>(function Button(
  {
    buttonContent,
    className,
    clicked,
    children,
    disabled = false,
    loading = false,
    type = "button",
    variant = "default",
    size = "md",
    ariaLabel,
    ...rest
  },
  ref
) {
  const isLoading = typeof loading === "boolean" ? loading : loading.isLoading;

  const variantClasses: { [key in IVariant]: string } = {
    default:
      "hover:bg-surface-hover border-border disabled:hover:bg-surface disabled:hover:border-border",
    danger:
      "bg-danger hover:bg-danger-hover text-white border-danger disabled:hover:bg-danger disabled:hover:border-danger",
    info: "bg-info hover:bg-info-hover text-white border-info disabled:hover:bg-info disabled:hover:border-info",
    warning:
      "bg-warning hover:bg-warning-hover text-white border-warning disabled:hover:bg-warning disabled:hover:border-warning",
    success:
      "bg-success hover:bg-success-hover text-white border-success disabled:hover:bg-success disabled:hover:border-success",
    primary:
      "bg-primary hover:bg-primary-hover text-white border-primary disabled:hover:bg-primary disabled:hover:border-primary",
  };

  const baseClasses =
    "border rounded-2xl cursor-pointer flex items-center justify-center text-base font-medium gap-2 bg-surface focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const isDisabled = disabled || isLoading;
  const disabledClasses = isDisabled && "opacity-50 cursor-not-allowed";
  const sizeClasses: { [key in IButtonSize]: string } = {
    xs: `${buttonHeightClasses.xs} px-2 text-xs`,
    sm: `${buttonHeightClasses.sm} px-2 text-sm`,
    md: `${buttonHeightClasses.md} px-4 text-base`,
    lg: `${buttonHeightClasses.lg} px-6 text-lg`,
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
        disabledClasses
      )}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      onClick={(event) => {
        // Prevent default form submission for button-type buttons
        if (type === "button") {
          event.preventDefault();
        }
        clicked?.(event);
      }}
      {...rest}>
      {isLoading && (
        <Spinner
          size={"sm"}
          variant={variant}
        />
      )}
      {buttonContent ?? children}
    </button>
  );
});
