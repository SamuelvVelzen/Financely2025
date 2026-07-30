import { getCurrencyMinorUnits } from "@/features/currency/config/currencies";
import {
  getCurrencyAffixes,
  getLocaleSeparators,
} from "@/features/currency/utils/currencyhelpers";
import { cn } from "@/features/util/cn";
import { LocaleHelpers } from "@/features/util/locale.helpers";
import { useMemo, useState, type FocusEvent } from "react";
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
  /** When set, values above this are rejected while typing. */
  max?: number;
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
  max,
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
  const [formatKey, setFormatKey] = useState(0);

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

  const roundedMax =
    max != null && Number.isFinite(max) ? Math.round(max * 100) / 100 : undefined;

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
          let committed = nextValue;
          if (
            roundedMax != null &&
            nextValue !== "" &&
            Number.isFinite(Number(nextValue)) &&
            Number(nextValue) > roundedMax + 1e-9
          ) {
            committed = String(roundedMax);
            // Remount when parent value is already at max — otherwise
            // NumericFormat can keep showing the rejected over-max text.
            setFormatKey((key) => key + 1);
          }
          field.onChange(committed as never);
          onValueChange?.(committed);
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
          } else if (
            roundedMax != null &&
            numericValue !== "" &&
            Number(numericValue) > roundedMax + 1e-9
          ) {
            commit(numericValue);
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
            key={formatKey}
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
            isAllowed={(values) => {
              if (roundedMax == null) {
                return true;
              }
              const { floatValue } = values;
              if (floatValue == null) {
                return true;
              }
              return floatValue <= roundedMax + 1e-9;
            }}
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
