/**
 * Serialization helpers for converting between generic values and strings.
 * Required for NativeSelect since HTML select elements only work with strings.
 */
export interface IValueSerialization<TValue> {
  /**
   * Converts a value to its string representation for use in HTML select elements.
   */
  valueToString?: (value: TValue) => string;
  /**
   * Converts a string back to the value type.
   */
  stringToValue?: (str: string) => TValue;
}

/**
 * Creates a function to convert a value to its string representation.
 * Uses the provided valueToString function or defaults to String().
 */
export function createValueToStringConverter<TValue>(
  valueToString?: (value: TValue) => string
): (value: TValue) => string {
  return valueToString ?? ((val: TValue) => String(val));
}

/**
 * Creates a function to convert a string back to the value type.
 * Uses the provided stringToValue function or defaults to a type assertion.
 */
export function createStringToValueConverter<TValue>(
  stringToValue?: (str: string) => TValue
): (str: string) => TValue {
  return (
    stringToValue ??
    ((str: string) => {
      // Default: if TValue is string, return as-is, otherwise try to parse
      // This is a fallback - users should provide stringToValue for non-string types
      return str as unknown as TValue;
    })
  );
}

/**
 * Converts a value or array of values to string(s) for use in HTML select elements.
 * Handles both single and multiple select modes.
 */
export function getStringValue<TValue>(
  val: TValue | TValue[] | undefined,
  multiple: boolean,
  serialization: IValueSerialization<TValue>
): string | string[] {
  const convertValueToString = createValueToStringConverter(
    serialization.valueToString
  );

  if (val === undefined) {
    return multiple ? [] : "";
  }
  if (multiple && Array.isArray(val)) {
    return val.map(convertValueToString);
  }
  return convertValueToString(val as TValue);
}
