"use client";

import {
  IFormOrControlledMode,
  useFormContextOptional,
} from "@/features/shared/hooks/use-form-context-optional";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import React, { useId } from "react";
import { Controller, type ControllerRenderProps } from "react-hook-form";

type RenderFieldParams = {
  field: ControllerRenderProps<Record<string, unknown>, string>;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
};

export type IBaseInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "name" | "value" | "onChange"
> &
  IPropsWithClassName & {
    label?: string;
    hint?: string;
    required?: boolean;
    id?: string;
    prefixIcon?: React.ReactNode;
    suffixIcon?: React.ReactNode;
    renderField?: (params: RenderFieldParams) => React.ReactNode;
  } & IFormOrControlledMode<string | number>;

export function BaseInput({
  className,
  type,
  label,
  hint,
  required,
  name,
  id,
  prefixIcon,
  suffixIcon,
  renderField,
  value: controlledValue,
  onChange: controlledOnChange,
  ...props
}: IBaseInputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const form = useFormContextOptional();

  // Detect mode: form mode if form context exists AND name is provided
  const isFormMode = form !== null && name !== undefined;
  // Controlled mode if not in form mode and controlled props are provided
  const isControlledMode =
    !isFormMode &&
    (controlledValue !== undefined || controlledOnChange !== undefined);

  // Exclude controlled mode props from props when in form mode to avoid conflicts
  const formModeProps = isFormMode
    ? { ...props, value: undefined, onChange: undefined }
    : props;

  const baseClasses =
    "border rounded-2xl bg-surface text-text hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed w-full";
  const widthBaseClasses = `h-9`;

  // Adjust padding based on icons
  const paddingClasses = cn(
    "py-2",
    prefixIcon ? "pl-9" : "pl-2",
    suffixIcon ? "pr-9" : "pr-2"
  );

  // Shared rendering logic
  const renderInputContent = (
    field: ControllerRenderProps<Record<string, unknown>, string>,
    borderClass: string,
    showError?: boolean,
    errorMessage?: string,
    isControlled?: boolean
  ) => {
    return (
      <div className={label || hint ? "space-y-1" : ""}>
        {label && (
          <Label
            htmlFor={inputId}
            required={required}>
            {label}
          </Label>
        )}
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
                required,
                className: cn(
                  baseClasses,
                  borderClass,
                  paddingClasses,
                  widthBaseClasses,
                  className
                ),
                ...props,
              },
            })
          ) : (
            <input
              type={type}
              id={inputId}
              required={required}
              className={cn(
                baseClasses,
                borderClass,
                paddingClasses,
                widthBaseClasses,
                className
              )}
              value={
                field.value as string | number | readonly string[] | undefined
              }
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={isControlled ? undefined : field.name}
              ref={isControlled ? undefined : field.ref}
              {...(isControlled ? props : formModeProps)}
            />
          )}
          {suffixIcon && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-text flex">
              {suffixIcon}
            </div>
          )}
        </div>
        {showError && errorMessage && (
          <p className="text-sm text-danger mt-1">{errorMessage}</p>
        )}
        {!showError && hint && (
          <p className="text-xs text-text-muted mt-1">{hint}</p>
        )}
      </div>
    );
  };

  // Render controlled mode
  if (isControlledMode) {
    const borderClass = "border-border";
    const inputValue = controlledValue ?? "";

    // Create a mock field for controlled mode
    const mockField: ControllerRenderProps<Record<string, unknown>, string> = {
      value: inputValue,
      onChange: (value: unknown) => {
        // Handle both event objects and direct values (for DecimalInput)
        if (value && typeof value === "object" && "target" in value) {
          // It's an event object - extract value and pass it
          const event = value as React.ChangeEvent<HTMLInputElement>;
          const extractedValue = event.target.value as
            | string
            | number
            | undefined;
          controlledOnChange?.(extractedValue);
        } else {
          // It's a direct value (e.g., string from DecimalInput)
          controlledOnChange?.(value as string | number | undefined);
        }
      },
      onBlur: () => {},
      name: name || "",
      ref: () => {},
    };

    return renderInputContent(mockField, borderClass, false, undefined, true);
  }

  // Render form mode
  if (!form || !name) {
    throw new Error(
      "BaseInput: Either provide 'name' prop with form context, or provide 'value' and 'onChange' props for controlled mode"
    );
  }

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => {
        const error = fieldState.error;
        const shouldShowError = error && form.formState.isSubmitted;
        const borderClass = shouldShowError ? "border-danger" : "border-border";

        return renderInputContent(
          field,
          borderClass,
          shouldShowError,
          error?.message as string | undefined
        );
      }}
    />
  );
}
