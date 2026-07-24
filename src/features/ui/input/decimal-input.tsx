import { getLocaleSeparators } from "@/features/currency/utils/currencyhelpers";
import { cn } from "@/features/util/cn";
import { LocaleHelpers } from "@/features/util/locale.helpers";
import { useMemo } from "react";
import { NumericFormat } from "react-number-format";

import {
  BaseInput,
  type IBaseInputProps,
  type IDistributeOmitInputKey,
} from "./input";

export type IDecimalInputProps = IDistributeOmitInputKey<
  IBaseInputProps,
  "type" | "inputMode" | "renderField" | "placeholder"
> & {
  locale?: string;
  placeholder?: number;
  onValueChange?: (value: string) => void;
};

function toNumericString(
  fieldValue: string | number | null | undefined
): string {
  if (typeof fieldValue === "number") {
    return Number.isFinite(fieldValue) ? String(fieldValue) : "";
  }
  if (typeof fieldValue === "string" && fieldValue.length > 0) {
    return fieldValue;
  }
  return "";
}

function padToTwoDecimals(value: string): string {
  if (!value) {
    return "";
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return value;
  }
  return numberValue.toFixed(2);
}

export function DecimalInput({
  locale,
  onValueChange,
  placeholder,
  name,
  value,
  onChange,
  ...props
}: IDecimalInputProps) {
  const resolvedLocale = useMemo(() => {
    return locale ?? LocaleHelpers.getLocale();
  }, [locale]);

  const separators = useMemo(
    () => getLocaleSeparators(resolvedLocale),
    [resolvedLocale]
  );

  return (
    <BaseInput
      {...props}
      {...(name
        ? ({ name } as { name: string })
        : ({ value, onChange } as {
            value: string | number;
            onChange: (value: string | number | undefined) => void;
          }))}
      type="text"
      inputMode="decimal"
      renderField={({ field, inputProps }) => {
        const numericValue = toNumericString(
          field.value as string | number | null | undefined
        );

        const {
          className,
          type: _type,
          inputMode: _inputMode,
          value: _value,
          defaultValue: _defaultValue,
          onChange: _onChange,
          onBlur: inputOnBlur,
          ...restInputProps
        } = inputProps;

        const commit = (nextValue: string) => {
          field.onChange(nextValue as never);
          onValueChange?.(nextValue);
        };

        return (
          <NumericFormat
            {...restInputProps}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={cn("text-right min-w-[10ch]", className)}
            placeholder={`${placeholder ?? "0"}${separators.decimal}00`}
            value={numericValue}
            valueIsNumericString
            thousandSeparator={separators.group}
            decimalSeparator={separators.decimal}
            allowedDecimalSeparators={[separators.decimal, ".", ","]}
            decimalScale={2}
            allowNegative={false}
            getInputRef={(node: HTMLInputElement | null) => {
              if (typeof field.ref === "function") {
                field.ref(node);
              }
            }}
            onValueChange={(values, sourceInfo) => {
              if (sourceInfo.source === "prop") {
                return;
              }
              commit(values.value);
            }}
            onBlur={(event) => {
              const padded = padToTwoDecimals(numericValue);
              if (padded !== numericValue) {
                commit(padded);
              }
              inputOnBlur?.(event);
              field.onBlur();
            }}
          />
        );
      }}
    />
  );
}
