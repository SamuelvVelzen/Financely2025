"use client";

import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { RadioGroupContext, type IRadioGroupContext } from "./radio-item";

export type IRadioGroupProps = IPropsWithClassName & {
  name: string;
  label?: string;
  hint?: string;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
  children: React.ReactNode;
};

export function RadioGroup({
  className,
  name,
  label,
  hint,
  required,
  orientation = "horizontal",
  children,
}: IRadioGroupProps) {
  const generatedId = useId();
  const groupId = `radio-group-${generatedId}`;
  const form = useFormContext();
  const error = form.formState.errors[name];

  const baseClasses = "space-y-1";
  const orientationClasses =
    orientation === "horizontal"
      ? "flex flex-wrap gap-3"
      : "flex flex-col gap-2";

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => {
        const contextValue: IRadioGroupContext = {
          name: field.name,
          value: field.value,
          onChange: field.onChange,
          disabled: false,
          groupId,
        };

        const fieldsetId = `${groupId}-fieldset`;
        const legendId = label ? `${groupId}-legend` : undefined;
        const errorId = error ? `${groupId}-error` : undefined;
        const hintId = hint ? `${groupId}-hint` : undefined;

        return (
          <div className={cn(baseClasses, className)}>
            <fieldset
              id={fieldsetId}
              className="border-0 p-0 m-0"
              aria-describedby={cn(
                errorId,
                hintId && !errorId ? hintId : undefined
              )}>
              {label && (
                <legend
                  id={legendId}
                  className="mb-2">
                  <Label
                    htmlFor={undefined}
                    required={required}>
                    {label}
                  </Label>
                </legend>
              )}
              <div className={cn(orientationClasses)}>
                <RadioGroupContext.Provider value={contextValue}>
                  {children}
                </RadioGroupContext.Provider>
              </div>
            </fieldset>
            {error && (
              <p
                id={errorId}
                className="text-sm text-danger mt-1"
                role="alert">
                {error.message as string}
              </p>
            )}
            {!error && hint && (
              <p
                id={hintId}
                className="text-xs text-text-muted mt-1">
                {hint}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
