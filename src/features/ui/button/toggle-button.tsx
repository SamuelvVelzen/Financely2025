"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import type { ReactNode } from "react";
import React, { useId, useRef, useState } from "react";

export type IToggleButtonSize = "sm" | "md" | "lg";

export type IToggleButtonProps = IPropsWithClassName & {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: IToggleButtonSize;
  id?: string;
  icon?: {
    on: { icon: ReactNode; className?: string };
    off: { icon: ReactNode; className?: string };
  };
};

const sizeConfig: {
  [key in IToggleButtonSize]: {
    trackWidth: string;
    trackHeight: string;
    thumbSize: string;
    thumbTranslate: string;
    iconSize: string;
  };
} = {
  sm: {
    trackWidth: "w-11", // 44px
    trackHeight: "h-6", // 24px
    thumbSize: "w-5 h-5", // 20px
    thumbTranslate: "translate-x-5", // 20px (44px - 20px - 4px padding)
    iconSize: "w-3 h-3", // 12px
  },
  md: {
    trackWidth: "w-14", // 56px (close to iOS 51px)
    trackHeight: "h-8", // 32px (close to iOS 31px)
    thumbSize: "w-7 h-7", // 28px
    thumbTranslate: "translate-x-6", // 24px (56px - 28px - 4px padding)
    iconSize: "w-4 h-4", // 16px
  },
  lg: {
    trackWidth: "w-16", // 64px
    trackHeight: "h-10", // 40px
    thumbSize: "w-9 h-9", // 36px
    thumbTranslate: "translate-x-6", // 24px (64px - 36px - 4px padding)
    iconSize: "w-5 h-5", // 20px
  },
};

export function ToggleButton({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  size = "md",
  className,
  id,
  icon,
  ...props
}: IToggleButtonProps) {
  const generatedId = useId();
  const toggleId = id || generatedId;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;
  const toggleRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();

    const newChecked = !checked;
    if (!isControlled) {
      setInternalChecked(newChecked);
    }
    onChange?.(newChecked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle(e);
    }
  };

  const config = sizeConfig[size];

  const buttonClassName = cn(
    "relative inline-flex items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
    config.trackWidth,
    config.trackHeight,
    checked ? "bg-success" : "bg-border",
    disabled && "opacity-50 cursor-not-allowed",
    !disabled && "cursor-pointer",
    className
  );

  const thumbClassName = cn(
    "absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out flex items-center justify-center",
    config.thumbSize,
    checked && config.thumbTranslate
  );

  return (
    <div className="flex items-center gap-2">
      <button
        {...props}
        ref={toggleRef}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-labelledby={label ? `${toggleId}-label` : undefined}
        id={toggleId}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={buttonClassName}
        data-checked={checked}>
        <span className={thumbClassName}>
          {icon && (
            <span
              className={cn(
                "transition-opacity duration-300 ease-in-out",
                config.iconSize,
                checked ? icon.on.className : icon.off.className
              )}>
              {checked ? icon.on.icon : icon.off.icon}
            </span>
          )}
        </span>
      </button>
      {label && (
        <label
          id={`${toggleId}-label`}
          htmlFor={toggleId}
          className={cn(
            "text-sm cursor-pointer select-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={(e) => !disabled && handleToggle(e)}>
          {label}
        </label>
      )}
    </div>
  );
}
