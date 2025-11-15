"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import React, { useId } from "react";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id"
> &
  PropsWithClassName & {
    error?: boolean;
    label: string;
    id?: string;
  };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, label, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const baseClasses =
      "w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
    const borderClass = error ? "border-danger" : "border-border";

    return (
      <div className={label ? "space-y-1" : ""}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(baseClasses, borderClass, className)}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
