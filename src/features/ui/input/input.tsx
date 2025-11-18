"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import React, { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type IInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name"
> &
  IPropsWithClassName & {
    name: string;
    label: string;
    id?: string;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
  };

export function Input({
  className,
  type,
  label,
  name,
  id,
  prefixIcon,
  suffixIcon,
  ...props
}: IInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const form = useFormContext();
  const error = form.formState.errors[name];

  const baseClasses =
    "w-full border rounded-lg bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = error ? "border-danger" : "border-border";

  // Adjust padding based on icons
  const paddingClasses =
    prefixIcon && suffixIcon
      ? "pl-10 pr-10 py-2"
      : prefixIcon
        ? "pl-10 pr-3 py-2"
        : suffixIcon
          ? "pl-3 pr-10 py-2"
          : "px-3 py-2";

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <div className={label ? "space-y-1" : ""}>
          {label && (
            <label
              htmlFor={inputId}
              className="block text-sm font-medium">
              {label}
            </label>
          )}
          <div className="relative">
            {prefixIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                {prefixIcon}
              </div>
            )}
            <input
              type={type}
              id={inputId}
              className={cn(
                baseClasses,
                borderClass,
                paddingClasses,
                className
              )}
              {...field}
              ref={field.ref}
              {...props}
            />
            {suffixIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                {suffixIcon}
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-danger mt-1">
              {error.message as string}
            </p>
          )}
        </div>
      )}
    />
  );
}
