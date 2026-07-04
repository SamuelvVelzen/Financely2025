import { cn } from "@/features/util/cn";
import { type ReactNode } from "react";
import { Tooltip } from "../tooltip/tooltip";
import { Button, type IButtonProps } from "./button";
import { iconButtonSizeClasses } from "./button-size-classes";

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

  const button = (
    <Button
      size={size}
      className={cn(
        "rounded-full shrink-0 px-0! py-0!",
        iconButtonSizeClasses[size],
        className,
      )}
      clicked={clicked}
      disabled={disabled}
      buttonContent={iconButtonContent}
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
