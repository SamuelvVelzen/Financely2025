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
import {
  createStringToValueConverter,
  createValueToStringConverter,
  getStringValue,
  type IValueSerialization,
} from "./select-helpers";

// Re-export for convenience
export type { IValueSerialization } from "./select-helpers";

export type ISelectInputProps<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
> = IPropsWithClassName &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
    options: TOption[] | readonly TOption[];
    multiple?: boolean;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
  } & IValueSerialization<TValue> &
  IFormOrControlledMode<TValue | TValue[]>;

export function NativeSelect<
  TValue = string,
  TOption extends ISelectOption<TValue> = ISelectOption<TValue>,
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
  valueToString,
  stringToValue,
  ...props
}: ISelectInputProps<TValue, TOption>) {
  const form = useFormContextOptional();

  // Create serialization converters
  const convertValueToString = createValueToStringConverter(valueToString);
  const convertStringToValue = createStringToValueConverter(stringToValue);

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
    value: TValue | TValue[] | undefined,
    onChange: (newValue: TValue | TValue[] | undefined) => void,
    selectProps?: {
      name?: string;
      ref?: React.Ref<HTMLSelectElement>;
      onBlur?: () => void;
    }
  ) => {
    const stringValue = getStringValue(value, multiple, {
      valueToString,
      stringToValue,
    });

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
            multiple
              ? Array.isArray(stringValue)
                ? stringValue
                : []
              : String(stringValue || "")
          }
          onChange={(e) => {
            if (multiple) {
              const selectedStrings = Array.from(
                e.target.selectedOptions,
                (option) => option.value
              );
              const selectedValues = selectedStrings.map(convertStringToValue);
              onChange(selectedValues as TValue[]);
            } else {
              const selectedString = e.target.value || "";
              if (selectedString === "") {
                onChange(undefined);
              } else {
                onChange(convertStringToValue(selectedString));
              }
            }
          }}
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
              key={String(option.value)}
              value={convertValueToString(option.value)}>
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
    return renderSelect(controlledValue, (newValue) => {
      controlledOnChange?.(newValue);
    });
  }

  // Render form mode
  if (isFormMode && form) {
    return (
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => {
          return renderSelect(
            field.value as TValue | TValue[] | undefined,
            field.onChange,
            {
              name: field.name,
              ref: field.ref,
              onBlur: field.onBlur,
            }
          );
        }}
      />
    );
  }

  // Fallback (should not happen with proper discriminated union)
  return null;
}
