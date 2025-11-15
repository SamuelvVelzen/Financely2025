"use client";

import { cn } from "@/util/cn";
import { PropsWithClassName } from "@/util/type-helpers/props";
import React, { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name"
> &
  PropsWithClassName & {
    name: string;
    label: string;
    id?: string;
  };

export function Input({
  className,
  type,
  label,
  name,
  id,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const form = useFormContext();
  const error = form.formState.errors[name];

  const baseClasses =
    "w-full px-3 py-2 border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = error ? "border-danger" : "border-border";

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
          <input
            type={type}
            id={inputId}
            className={cn(baseClasses, borderClass, className)}
            {...field}
            ref={field.ref}
            {...props}
          />
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
