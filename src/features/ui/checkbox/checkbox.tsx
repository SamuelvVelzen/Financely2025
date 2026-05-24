import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useEffect, useId, useRef } from "react";

export type ICheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "id"
> &
  IPropsWithClassName & {
    id?: string;
    label?: string;
    hint?: string;
    error?: string;
    indeterminate?: boolean;
  };

export function Checkbox({
  className,
  id,
  label,
  hint,
  error,
  checked,
  onChange,
  disabled,
  indeterminate,
  ...props
}: ICheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;
  const errorId = `${checkboxId}-error`;
  const hintId = `${checkboxId}-hint`;
  const checkboxRef = useRef<HTMLInputElement>(null);
  const hasError = !!error;
  const ariaDescribedBy = [hasError ? errorId : undefined, !hasError && hint ? hintId : undefined]
    .filter(Boolean)
    .join(" ") || undefined;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate ?? false;
    }
  }, [indeterminate]);

  const baseClasses =
    "size-4 border rounded cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none relative";
  const borderClass =
    indeterminate || checked
      ? "bg-primary border-primary text-white"
      : "bg-surface border-border";

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex">
          <input
            type="checkbox"
            id={checkboxId}
            ref={checkboxRef}
            className={cn(baseClasses, borderClass)}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={hasError ? true : undefined}
            aria-describedby={ariaDescribedBy}
            {...props}
          />
          <svg
            className="absolute top-0 left-0 size-4 pointer-events-none text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="3"
            aria-hidden>
            {indeterminate && (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14"
              />
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
            )}>
            {label}
          </label>
        )}
      </div>
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-danger">
          {error}
        </p>
      )}
      {!hasError && hint && (
        <p
          id={hintId}
          className="text-xs text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
