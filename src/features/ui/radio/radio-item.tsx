"use client";

import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useContext, useId, useRef } from "react";
import { IconType } from "react-icons";

export type IRadioGroupContext = {
  name: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  groupId: string;
};

export const RadioGroupContext = React.createContext<IRadioGroupContext | null>(
  null
);

export type IRadioItemProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "id" | "name" | "checked" | "onChange" | "value"
> &
  IPropsWithClassName & {
    value: string | number;
    id?: string;
    children?: React.ReactNode;
    icon?: IconType;
  };

export function RadioItem({
  className,
  id,
  value,
  disabled,
  children,
  icon: Icon,
  ...props
}: IRadioItemProps) {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error("RadioItem must be used within a RadioGroup");
  }

  const generatedId = useId();
  const radioId = id || `${context.groupId}-${generatedId}`;
  const isChecked = context.value === value;
  const isDisabled = disabled || context.disabled;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = () => {
    if (!isDisabled) {
      context.onChange(value);
    }
  };

  return (
    <div className="relative group grow">
      <input
        ref={inputRef}
        type="radio"
        id={radioId}
        name={context.name}
        value={String(value)}
        checked={isChecked}
        onChange={handleChange}
        disabled={isDisabled}
        className="sr-only peer"
        aria-checked={isChecked}
        {...props}
      />
      <label
        htmlFor={radioId}
        className={cn(
          "relative block cursor-pointer focus:outline-none p-2 rounded-2xl border transition-all text-left hover:border-primary/50 hover:bg-surface-hover/50",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-primary",
          "border-border bg-surface",
          isDisabled && "opacity-50 cursor-not-allowed",
          isChecked && "border-primary bg-primary/5 hover:border-primary",
          className
        )}
        onClick={(e) => {
          if (!isDisabled) {
            e.preventDefault();
            handleChange();
          }
        }}
        onMouseDown={(e) => {
          // Prevent focus on mouse click to maintain keyboard-only focus styles
          if (!isDisabled && e.detail > 0) {
            e.preventDefault();
            handleChange();
          }
        }}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={cn(
                "p-2 rounded-2xl shrink-0 bg-surface-hover text-text-muted",
                isChecked && "bg-primary text-white"
              )}>
              <Icon className="size-5" />
            </div>
          )}

          {children}
        </div>

        {isChecked && (
          <div className="absolute top-2 right-2">
            <div className="size-2 bg-primary rounded-full" />
          </div>
        )}
      </label>
    </div>
  );
}
