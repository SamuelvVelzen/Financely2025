"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { Label } from "@/features/ui/typography/label";
import React, { useId } from "react";
import {
  Controller,
  useFormContext,
  type ControllerRenderProps,
} from "react-hook-form";

type RenderFieldParams = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
};

export type IBaseInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name"
> &
  IPropsWithClassName & {
    name: string;
    label?: string;
    id?: string;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
    renderField?: (params: RenderFieldParams) => React.ReactNode;
  };

export function BaseInput({
  className,
  type,
  label,
  name,
  id,
  prefixIcon,
  suffixIcon,
  renderField,
  style,
  ...props
}: IBaseInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const form = useFormContext();
  const error = form.formState.errors[name];

  const baseClasses =
    "border rounded-2xl bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = error ? "border-danger" : "border-border";
  const widthBaseClasses = `h-[22px] box-content`;

  // Adjust padding based on icons
  const paddingClasses = cn(
    "py-2",
    prefixIcon ? "pl-9" : "pl-2",
    suffixIcon ? "pr-9" : "pr-2"
  );

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <div className={label ? "space-y-1" : ""}>
          {label && <Label htmlFor={inputId}>{label}</Label>}
          <div className="relative">
            {prefixIcon && (
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-text pointer-events-none">
                {prefixIcon}
              </div>
            )}
            {renderField ? (
              renderField({
                field,
                inputProps: {
                  type,
                  id: inputId,
                  className: cn(
                    baseClasses,
                    borderClass,
                    paddingClasses,
                    widthBaseClasses,
                    className
                  ),
                  style: {
                    width: `calc(100% - ${(prefixIcon ? 36 : 8) + (suffixIcon ? 36 : 8) + 2}px)`,
                    ...(style ?? {}),
                  },
                  ...props,
                },
              })
            ) : (
              <input
                type={type}
                id={inputId}
                className={cn(
                  baseClasses,
                  borderClass,
                  paddingClasses,
                  widthBaseClasses,
                  className
                )}
                style={{
                  width: `calc(100% - ${(prefixIcon ? 36 : 8) + (suffixIcon ? 36 : 8) + 2}px)`,
                  ...(style ?? {}),
                }}
                {...field}
                ref={field.ref}
                {...props}
              />
            )}
            {suffixIcon && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-text flex">
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
