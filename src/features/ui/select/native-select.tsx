"use client";

import {
  IFormOrControlledMode,
  useFormContextOptional,
} from "@/features/shared/hooks/use-form-context-optional";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { SelectHTMLAttributes } from "react";
import { Controller } from "react-hook-form";
import { ISelectOption } from "./select";

export type ISelectInputProps<
  TOptions extends ISelectOption[] | readonly ISelectOption[] = ISelectOption[],
> = IPropsWithClassName &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
    options: TOptions;
    multiple?: boolean;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
  } & IFormOrControlledMode<string | string[]>;

export function NativeSelect<
  TOptions extends ISelectOption[] | readonly ISelectOption[] = ISelectOption[],
>({
  className = "",
  name,
  options,
  multiple = false,
  placeholder = "Select...",
  label,
  disabled = false,
  value: controlledValue,
  onChange: controlledOnChange,
  ...props
}: ISelectInputProps<TOptions>) {
  const form = useFormContextOptional();

  // Determine mode
  const isFormMode = !!name && !!form;
  const isControlledMode =
    controlledValue !== undefined && !!controlledOnChange;

  const error = isFormMode && form ? form.formState.errors[name] : undefined;

  const baseClasses =
    "border rounded-2xl bg-surface text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = error ? "border-danger" : "border-border";
  const widthBaseClasses = `h-[22px] box-content`;

  const paddingClasses = "py-2 pl-2 pr-2";

  // Shared rendering logic
  const renderSelect = (
    value: string | string[] | undefined,
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void,
    selectProps?: {
      name?: string;
      ref?: React.Ref<HTMLSelectElement>;
      onBlur?: () => void;
    }
  ) => {
    return (
      <div className={cn("relative", label ? "space-y-1" : "", className)}>
        {label && <Label>{label}</Label>}
        <select
          {...selectProps}
          multiple={multiple}
          disabled={disabled}
          className={cn(
            baseClasses,
            borderClass,
            paddingClasses,
            widthBaseClasses,
            "w-full"
          )}
          value={
            multiple ? (Array.isArray(value) ? value : []) : String(value || "")
          }
          onChange={onChange}
          {...props}>
          {!multiple && (
            <option
              value=""
              disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-danger mt-1">
            {(error as { message?: string })?.message || String(error)}
          </p>
        )}
      </div>
    );
  };

  // Render controlled mode
  if (isControlledMode) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (multiple) {
        const selectedValues = Array.from(
          e.target.selectedOptions,
          (option) => option.value
        );
        controlledOnChange?.(selectedValues);
      } else {
        controlledOnChange?.(e.target.value || undefined);
      }
    };

    return renderSelect(controlledValue, handleChange);
  }

  // Render form mode
  if (isFormMode && form) {
    return (
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => {
          const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            if (multiple) {
              const selectedValues = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              field.onChange(selectedValues);
            } else {
              field.onChange(e.target.value || undefined);
            }
          };

          const value = field.value as string | string[] | undefined;
          return renderSelect(value, handleChange, {
            name: field.name,
            ref: field.ref,
            onBlur: field.onBlur,
          });
        }}
      />
    );
  }

  // Fallback (should not happen with proper discriminated union)
  return null;
}
