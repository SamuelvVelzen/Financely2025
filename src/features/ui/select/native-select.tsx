"use client";

import { cn } from "@/util/cn";
import { IPropsWithClassName } from "@/util/type-helpers/props";
import { Controller, useFormContext } from "react-hook-form";

export type ISelectOption<TData = unknown> = {
  value: string;
  label: string;
  data?: TData;
};

// Helper type to extract data type from options array
type ExtractDataFromOptions<
  TOptions extends ISelectOption<any>[] | readonly ISelectOption<any>[],
> = TOptions[number] extends ISelectOption<infer TData> ? TData : unknown;

export type ISelectInputProps<
  TOptions extends
    | ISelectOption<any>[]
    | readonly ISelectOption<any>[] = ISelectOption[],
  TData = ExtractDataFromOptions<TOptions>,
> = IPropsWithClassName & {
  name: string;
  options: TOptions;
  multiple?: boolean;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
};

export function NativeSelect<
  TOptions extends
    | ISelectOption<any>[]
    | readonly ISelectOption<any>[] = ISelectOption[],
  TData = ExtractDataFromOptions<TOptions>,
>({
  className = "",
  name,
  options,
  multiple = false,
  placeholder = "Select...",
  label,
  disabled = false,
}: ISelectInputProps<TOptions, TData>) {
  const form = useFormContext();
  const error = form.formState.errors[name];

  const baseClasses =
    "border rounded-2xl bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const borderClass = error ? "border-danger" : "border-border";
  const widthBaseClasses = `h-[22px] box-content`;

  const paddingClasses = "py-2 pl-2 pr-2";

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <div className={cn("relative", label ? "space-y-1" : "", className)}>
          {label && (
            <label className="block text-sm font-medium">{label}</label>
          )}
          <select
            name={field.name}
            ref={field.ref}
            onBlur={field.onBlur}
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
              multiple
                ? Array.isArray(field.value)
                  ? field.value
                  : []
                : field.value || ""
            }
            onChange={(e) => {
              if (multiple) {
                const selectedValues = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                );
                field.onChange(selectedValues);
              } else {
                field.onChange(e.target.value || undefined);
              }
            }}
          >
            {!multiple && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
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
      )}
    />
  );
}
