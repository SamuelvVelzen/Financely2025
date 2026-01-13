import { cn } from "@/features/util/cn";
import { ReactNode } from "react";
import { Tooltip } from "../tooltip/tooltip";
import { Button, IButtonProps, IButtonSize } from "./button";

type IIconButton = {
  icon?: ReactNode;
  clicked: NonNullable<IButtonProps["clicked"]>;
  disabled?: IButtonProps["disabled"];
  /** Optional tooltip text. If provided, wraps the button with a tooltip */
  tooltip?: ReactNode;
  /** Tooltip placement. Defaults to "auto" */
  tooltipPlacement?: "top" | "bottom" | "left" | "right" | "auto";
} & Omit<IButtonProps, "clicked" | "type">;

export function IconButton({
  children,
  className,
  icon,
  clicked,
  disabled = false,
  size = "md",
  tooltip,
  tooltipPlacement = "auto",
  ...props
}: IIconButton) {
  const iconButtonContent = children ? children : icon;

  const sizeClasses: { [key in IButtonSize]: string } = {
    xs: "p-0.5 -my-0.5",
    sm: "p-1 -my-1.",
    md: "p-2 -my-2",
    lg: "p-4 -my-4",
  };

  const button = (
    <Button
      className={cn("rounded-full", sizeClasses[size], className)}
      clicked={clicked}
      disabled={disabled}
      buttonContent={iconButtonContent}
      size={size}
      {...props}
    />
  );

  // Wrap with tooltip if tooltip prop is provided
  if (tooltip) {
    return (
      <Tooltip
        content={tooltip}
        placement={tooltipPlacement}
        disabled={disabled}>
        {button}
      </Tooltip>
    );
  }

  return button;
}
