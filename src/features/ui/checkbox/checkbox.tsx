"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import React, { useEffect, useId, useRef } from "react";

export type ICheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "id"
> &
  IPropsWithClassName & {
    id?: string;
    label?: string;
    indeterminate?: boolean;
  };

export function Checkbox({
  className,
  id,
  label,
  checked,
  onChange,
  disabled,
  indeterminate,
  ...props
}: ICheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  const baseClasses =
    "w-4 h-4 border rounded cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none relative";
  const borderClass =
    indeterminate || checked
      ? "bg-primary border-primary text-white"
      : "bg-surface border-border";

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex">
        <input
          type="checkbox"
          id={checkboxId}
          ref={checkboxRef}
          className={cn(baseClasses, borderClass, className)}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        <svg
          className="absolute top-0 left-0 w-4 h-4 pointer-events-none text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          {indeterminate && (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          )}
          {checked && !indeterminate && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L18 6"
            />
          )}
        </svg>
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          className={cn(
            "text-sm cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
}
