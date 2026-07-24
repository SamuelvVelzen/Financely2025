import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import {
  getCurrencyAffixes,
  getLocaleSeparators,
} from "@/features/currency/utils/currencyhelpers";
import { cn } from "@/features/util/cn";
import { LocaleHelpers } from "@/features/util/locale.helpers";
import { useMemo, type FocusEvent } from "react";
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
  /** ISO 4217 code — shows currency via NumericFormat prefix/suffix. */
  currency?: string;
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

function padToFractionDigits(value: string, fractionDigits: number): string {
  if (!value) {
    return "";
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return value;
  }
  return numberValue.toFixed(fractionDigits);
}

export function DecimalInput({
  locale,
  currency,
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

  const fractionDigits = currency ? getCurrencyMinorUnits(currency) : 2;

  const affixes = useMemo(() => {
    if (!currency) {
      return { prefix: undefined, suffix: undefined };
    }
    const { prefix, suffix } = getCurrencyAffixes(currency, resolvedLocale);
    return {
      prefix: prefix || undefined,
      suffix: suffix || undefined,
    };
  }, [currency, resolvedLocale]);

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

        const sharedClassName = cn(
          "text-right min-w-[10ch]",
          currency ? "min-w-[12ch]" : null,
          className
        );

        const sharedPlaceholder = `${placeholder ?? "0"}${
          fractionDigits > 0
            ? `${separators.decimal}${"0".repeat(fractionDigits)}`
            : ""
        }`;

        const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
          const padded = padToFractionDigits(numericValue, fractionDigits);
          if (padded !== numericValue) {
            commit(padded);
          }
          inputOnBlur?.(event);
          field.onBlur();
        };

        const getInputRef = (node: HTMLInputElement | null) => {
          if (typeof field.ref === "function") {
            field.ref(node);
          }
        };

        return (
          <NumericFormat
            {...restInputProps}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={sharedClassName}
            placeholder={sharedPlaceholder}
            value={numericValue}
            valueIsNumericString
            thousandSeparator={separators.group}
            decimalSeparator={separators.decimal}
            allowedDecimalSeparators={[separators.decimal, ".", ","]}
            decimalScale={fractionDigits}
            allowNegative={false}
            prefix={affixes.prefix}
            suffix={affixes.suffix}
            getInputRef={getInputRef}
            onValueChange={(values, sourceInfo) => {
              if (sourceInfo.source === "prop") {
                return;
              }
              commit(values.value);
            }}
            onBlur={handleBlur}
          />
        );
      }}
    />
  );
}
