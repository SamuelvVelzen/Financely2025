import {
  IFormOrControlledMode,
} from "@/features/shared/hooks/use-form-context-optional";
import { useFieldAdapter } from "@/features/shared/hooks/use-field-adapter";
import { Label } from "@/features/ui/typography/label";
import { cn } from "@/features/util/cn";
import { IPropsWithClassName } from "@/features/util/type-helpers/props";
import { SelectHTMLAttributes } from "react";
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
  onValueChange,
  valueToString,
  stringToValue,
  ...props
}: ISelectInputProps<TValue, TOption>) {
  // Create serialization converters
  const convertValueToString = createValueToStringConverter(valueToString);
  const convertStringToValue = createStringToValueConverter(stringToValue);

  const { field, error, borderClass, renderWithController } = useFieldAdapter({
    name,
    value: controlledValue,
    onChange: controlledOnChange,
    onValueChange,
  });

  const baseClasses =
    "border rounded-2xl bg-surface text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";
  const widthBaseClasses = `h-[22px] box-content`;

  const paddingClasses = "py-2 pl-2 pr-2";

  // Shared rendering logic
  const renderSelect = (
    currentField: typeof field,
    selectProps?: {
      name?: string;
      ref?: React.Ref<HTMLSelectElement>;
      onBlur?: () => void;
    }
  ) => {
    const value = currentField.value as TValue | TValue[] | undefined;
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
              currentField.onChange(selectedValues as TValue[]);
            } else {
              const selectedString = e.target.value || "";
              if (selectedString === "") {
                currentField.onChange(undefined);
              } else {
                currentField.onChange(convertStringToValue(selectedString));
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
            {error.message || String(error)}
          </p>
        )}
      </div>
    );
  };

  // Render using the adapter
  return renderWithController((currentField) => {
    return renderSelect(
      currentField,
      {
        name: currentField.name,
        ref: currentField.ref as React.Ref<HTMLSelectElement>,
        onBlur: currentField.onBlur,
      }
    );
  });
}
