import { cn } from "@/features/util/cn";
import { Button, type IButtonProps, type IVariant } from "./button";

type ILinkButtonAppearance = "filled" | "outlined";

type ILinkButton = {
  clicked: NonNullable<IButtonProps["clicked"]>;
  disabled?: IButtonProps["disabled"];
  /** Filled text link (default) or outlined action for use on colored Alert backgrounds */
  appearance?: ILinkButtonAppearance;
} & Omit<IButtonProps, "clicked" | "type">;

const filledVariantClasses: { [key in IVariant]: string } = {
  default: "text-text",
  primary: "text-primary",
  danger: "text-danger",
  info: "text-info",
  warning: "text-warning",
  success: "text-success",
  secondary: "text-secondary",
};

const outlinedVariantClasses: { [key in IVariant]: string } = {
  default:
    "text-text border-border/60 hover:bg-surface-hover/60 hover:text-text",
  primary:
    "text-primary border-primary/30 hover:bg-primary/15 hover:text-primary",
  danger: "text-danger border-danger/30 hover:bg-danger/15 hover:text-danger",
  info: "text-info border-info/30 hover:bg-info/15 hover:text-info",
  warning:
    "text-warning border-warning/30 hover:bg-warning/15 hover:text-warning",
  success:
    "text-success border-success/30 hover:bg-success/15 hover:text-success",
  secondary:
    "text-secondary border-secondary/30 hover:bg-secondary/15 hover:text-secondary",
};

export function LinkButton({
  children,
  className,
  clicked,
  disabled = false,
  variant = "default",
  appearance = "filled",
  ...props
}: ILinkButton) {
  const isOutlined = appearance === "outlined";

  return (
    <Button
      className={cn(
        "bg-transparent text-sm disabled:hover:bg-transparent",
        isOutlined
          ? "font-medium rounded-lg border px-2 py-0.5 hover:no-underline"
          : "border-none p-0 font-normal hover:underline hover:bg-transparent",
        isOutlined
          ? outlinedVariantClasses[variant]
          : filledVariantClasses[variant],
        className
      )}
      clicked={clicked}
      disabled={disabled}
      {...props}>
      {children}
    </Button>
  );
}
