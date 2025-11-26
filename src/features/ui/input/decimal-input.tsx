"use client";

import {
  formatDecimal,
  getLocaleSeparators,
  parseLocalizedDecimal,
} from "@/util/currency/currencyhelpers";
import React, { useEffect, useMemo, useRef } from "react";

import { BaseInput, type IBaseInputProps } from "./input";

const FRACTION_DIGITS = 2;

type CaretInfo = {
  integerDigits: number;
  fractionDigits: number;
  inFraction: boolean;
};

export type IDecimalInputProps = Omit<
  IBaseInputProps,
  "type" | "inputMode" | "renderField" | "placeholder"
> & {
  locale?: string;
  onValueChange?: (value: string) => void;
};

type CaretSyncTask = {
  frameId: number | null;
  remainingRuns: number;
  position: number;
  value: string;
};

export function DecimalInput({
  locale,
  onValueChange,
  ...props
}: IDecimalInputProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const caretSyncTaskRef = useRef<CaretSyncTask | null>(null);

  const resolvedLocale = useMemo(() => {
    if (locale) {
      return locale;
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return "en-US";
  }, [locale]);

  const separators = useMemo(
    () => getLocaleSeparators(resolvedLocale),
    [resolvedLocale]
  );

  useEffect(() => {
    return () => {
      const task = caretSyncTaskRef.current;
      if (task?.frameId) {
        cancelAnimationFrame(task.frameId);
      }
      caretSyncTaskRef.current = null;
    };
  }, []);

  const scheduleCaretSync = (value: string, position: number) => {
    if (caretSyncTaskRef.current?.frameId) {
      cancelAnimationFrame(caretSyncTaskRef.current.frameId);
    }

    const task: CaretSyncTask = {
      frameId: null,
      remainingRuns: 3,
      position,
      value,
    };
    caretSyncTaskRef.current = task;

    const run = () => {
      const currentTask = caretSyncTaskRef.current;
      if (!currentTask) {
        return;
      }

      currentTask.frameId = null;

      const input = inputRef.current;
      if (!input || document.activeElement !== input) {
        caretSyncTaskRef.current = null;
        return;
      }

      if (input.value !== currentTask.value) {
        if (currentTask.remainingRuns > 0) {
          currentTask.remainingRuns -= 1;
          currentTask.frameId = requestAnimationFrame(run);
        } else {
          caretSyncTaskRef.current = null;
        }
        return;
      }

      input.setSelectionRange(
        Math.min(currentTask.position, input.value.length),
        Math.min(currentTask.position, input.value.length)
      );

      if (currentTask.remainingRuns > 0) {
        currentTask.remainingRuns -= 1;
        currentTask.frameId = requestAnimationFrame(run);
      } else {
        caretSyncTaskRef.current = null;
      }
    };

    task.frameId = requestAnimationFrame(run);
  };

  return (
    <BaseInput
      {...props}
      inputMode="decimal"
      renderField={({ field, inputProps }) => {
        const { onChange, ...restInputProps } = inputProps;
        const fieldValue = field.value as string | number | null | undefined;
        const previousNormalized =
          typeof fieldValue === "string" && fieldValue.length > 0
            ? fieldValue
            : "";
        const formattedValue = formatDecimal(previousNormalized, {
          locale: resolvedLocale,
        });

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const target = event.target;
          const caretPosition =
            target.selectionStart !== null
              ? target.selectionStart
              : target.value.length;

          const caretInfo = computeCaretInfo(
            target.value,
            caretPosition,
            separators
          );

          const nativeEvent = event.nativeEvent as InputEvent;
          const removalInfo =
            nativeEvent.inputType === "deleteContentBackward"
              ? getRemovedCharInfo(formattedValue, target.value)
              : null;

          let effectiveNormalized = parseLocalizedDecimal(target.value, {
            locale: resolvedLocale,
          });
          let caretInfoForNext = caretInfo;

          if (
            removalInfo &&
            !isDigit(removalInfo.char) &&
            removalInfo.index !== null
          ) {
            const digitOrdinal = countDigitsUpToIndex(
              formattedValue,
              removalInfo.index
            );
            if (digitOrdinal > 0) {
              effectiveNormalized = removeDigitAtOrdinal(
                previousNormalized,
                digitOrdinal
              );
              caretInfoForNext = {
                integerDigits: Math.max(digitOrdinal - 1, 0),
                fractionDigits: 0,
                inFraction: false,
              };
            }
          }

          const nextFormattedValue = formatDecimal(effectiveNormalized, {
            locale: resolvedLocale,
          });

          const nextCaretPosition = computeFormattedCaretPosition(
            nextFormattedValue,
            separators,
            caretInfoForNext
          );

          scheduleCaretSync(nextFormattedValue, nextCaretPosition);
          field.onChange(effectiveNormalized);
          onValueChange?.(effectiveNormalized);
          onChange?.(event);
        };

        return (
          <input
            {...field}
            {...restInputProps}
            placeholder={`0${separators.decimal}00`}
            inputMode="decimal"
            value={formattedValue}
            ref={(node) => {
              inputRef.current = node;
              field.ref(node);
            }}
            onChange={handleChange}
          />
        );
      }}
    />
  );
}

function computeCaretInfo(
  value: string,
  caretPosition: number,
  separators: { decimal: string; group: string }
): CaretInfo {
  let caretIntegerDigits = 0;
  let caretFractionDigits = 0;
  let hasDecimal = false;
  let decimalIndex = -1;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (isDigit(char)) {
      if (i < caretPosition) {
        if (hasDecimal) {
          caretFractionDigits++;
        } else {
          caretIntegerDigits++;
        }
      }
    } else if (!hasDecimal && isDecimalChar(char, separators)) {
      hasDecimal = true;
      decimalIndex = i;
    }
  }

  const caretInFraction =
    hasDecimal &&
    (caretPosition > decimalIndex || caretPosition === value.length);

  return {
    integerDigits: caretIntegerDigits,
    fractionDigits: caretFractionDigits,
    inFraction: caretInFraction,
  };
}

function getRemovedCharInfo(previousValue: string, nextValue: string) {
  if (nextValue.length >= previousValue.length) {
    return null;
  }
  const lengthDifference = previousValue.length - nextValue.length;
  if (lengthDifference > 1) {
    return null;
  }
  let index = 0;
  while (
    index < nextValue.length &&
    previousValue[index] === nextValue[index]
  ) {
    index++;
  }
  return {
    char: previousValue[index] ?? "",
    index,
  };
}

function computeFormattedCaretPosition(
  formattedValue: string,
  separators: { decimal: string; group: string },
  caretInfo: CaretInfo
): number {
  if (!formattedValue) {
    return 0;
  }

  const decimalIndex = formattedValue.indexOf(separators.decimal);

  if (decimalIndex === -1) {
    return formattedValue.length;
  }

  if (caretInfo.inFraction) {
    const desiredFractionDigits = Math.min(
      caretInfo.fractionDigits,
      FRACTION_DIGITS
    );
    return Math.min(
      decimalIndex + 1 + desiredFractionDigits,
      formattedValue.length
    );
  }

  const totalIntegerDigits = countDigitsBeforeDecimal(
    formattedValue,
    decimalIndex
  );
  const desiredIntegerDigits = Math.min(
    caretInfo.integerDigits,
    totalIntegerDigits
  );

  if (desiredIntegerDigits <= 0) {
    return findFirstDigitIndex(formattedValue);
  }

  let digitsSeen = 0;
  for (let i = 0; i < decimalIndex; i++) {
    if (isDigit(formattedValue[i])) {
      digitsSeen++;
      if (digitsSeen === desiredIntegerDigits) {
        return i + 1;
      }
    }
  }

  return decimalIndex;
}

function countDigitsBeforeDecimal(value: string, decimalIndex: number): number {
  let count = 0;
  for (let i = 0; i < value.length; i++) {
    if (i >= decimalIndex && decimalIndex !== -1) {
      break;
    }
    if (isDigit(value[i])) {
      count++;
    }
  }
  return count;
}

function findFirstDigitIndex(value: string): number {
  for (let i = 0; i < value.length; i++) {
    if (isDigit(value[i])) {
      return i;
    }
  }
  return 0;
}

function isDigit(char: string): boolean {
  return /\d/.test(char);
}

function isDecimalChar(
  char: string,
  separators: { decimal: string; group: string }
): boolean {
  if (!char) {
    return false;
  }
  if (char === separators.decimal) {
    return true;
  }
  return char === ".";
}

function countDigitsUpToIndex(value: string, index: number): number {
  let count = 0;
  for (let i = 0; i < value.length && i < index; i++) {
    if (isDigit(value[i])) {
      count++;
    }
  }
  return count;
}

function removeDigitAtOrdinal(value: string, ordinal: number): string {
  if (ordinal <= 0) {
    return value;
  }
  const [integerPartRaw, fractionPartRaw = ""] = value.split(".");
  const integerDigits = integerPartRaw.split("");
  const fractionDigits = fractionPartRaw
    .padEnd(FRACTION_DIGITS, "0")
    .split("")
    .slice(0, FRACTION_DIGITS);

  if (ordinal <= integerDigits.length) {
    integerDigits.splice(ordinal - 1, 1);
  } else {
    const fractionalOrdinal = ordinal - integerDigits.length;
    if (fractionalOrdinal >= 1 && fractionalOrdinal <= fractionDigits.length) {
      fractionDigits.splice(fractionalOrdinal - 1, 1);
      fractionDigits.push("0");
    }
  }

  const nextInteger = normalizeIntegerDigits(integerDigits);
  const nextFraction = fractionDigits
    .join("")
    .padEnd(FRACTION_DIGITS, "0")
    .slice(0, FRACTION_DIGITS);

  return `${nextInteger}.${nextFraction}`;
}

function normalizeIntegerDigits(digits: string[]): string {
  const joined = digits.join("").replace(/^0+(?=\d)/, "");
  return joined.length > 0 ? joined : "0";
}
