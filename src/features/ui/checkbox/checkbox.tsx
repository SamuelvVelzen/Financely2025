"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import React, { useId } from "react";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "id"
> &
  PropsWithClassName & {
    id?: string;
    label?: string;
  };

export function Checkbox({
  className,
  id,
  label,
  checked,
  onChange,
  disabled,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  const baseClasses =
    "w-4 h-4 border rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none relative";
  const borderClass = checked
    ? "bg-primary border-primary text-white"
    : "bg-surface border-border";

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(baseClasses, borderClass, className)}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {checked && (
          <svg
            className="absolute top-0 left-0 w-4 h-4 pointer-events-none text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 16l4 4L18 10"
            />
          </svg>
        )}
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={cn(
            "text-sm cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}>
          {label}
        </label>
      )}
    </div>
  );
}
