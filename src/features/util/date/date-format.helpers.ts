import type { ITimePrecision } from "@/features/shared/validation/schemas";
import { isValid, parse, parseISO } from "date-fns";
import { LocaleHelpers } from "../locale.helpers";

const DATE_ONLY_PARSE_FORMATS = [
  "dd/MM/yyyy",
  "MM/dd/yyyy",
  "dd-MM-yyyy",
  "dd.MM.yyyy",
  "d/M/yyyy",
  "M/d/yyyy",
  "yyyy/MM/dd",
];

const DATE_TIME_PARSE_FORMATS = [
  "dd/MM/yyyy HH:mm",
  "MM/dd/yyyy HH:mm",
  "dd-MM-yyyy HH:mm",
  "dd.MM.yyyy HH:mm",
  "yyyy-MM-dd HH:mm",
  "yyyy-MM-dd'T'HH:mm",
];

export class DateFormatHelpers {
  /**
   * Format ISO datetime string to localized string
   * For DateOnly precision, shows date only (no time)
   * For DateTime precision, shows date + time
   */
  public static formatIsoStringToString(
    isoString: string,
    timePrecision?: ITimePrecision
  ): string {
    const local = LocaleHelpers.getLocale();
    const date = new Date(isoString);

    if (timePrecision === "DateOnly") {
      // Date only - no time component
      return date.toLocaleDateString(local, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    // DateTime - include time
    return date.toLocaleDateString(local, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /** Format ISO datetime string to localized time only (hours + minutes). */
  public static formatIsoStringToTimeOnly(isoString: string): string {
    const local = LocaleHelpers.getLocale();
    const date = new Date(isoString);
    return date.toLocaleTimeString(local, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Placeholder hint for typed date input, derived from the user's locale
   * (e.g. "27/06/2026" for nl-NL, "06/27/2026" for en-US).
   */
  public static getDateInputPlaceholder(
    timePrecision: ITimePrecision = "DateOnly"
  ): string {
    const locale = LocaleHelpers.getLocale();
    const sample = new Date(2026, 5, 27, 14, 30);
    const options: Intl.DateTimeFormatOptions =
      timePrecision === "DateTime"
        ? {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }
        : {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          };

    return new Intl.DateTimeFormat(locale, options).format(sample);
  }

  /**
   * Parse a user-typed date string into a Date.
   * Accepts ISO, common numeric formats, and locale-style strings.
   */
  public static parseStringToDate(
    input: string,
    timePrecision: ITimePrecision = "DateOnly"
  ): Date | null {
    const trimmed = input.trim();
    if (!trimmed) {
      return null;
    }

    try {
      const isoParsed = parseISO(trimmed);
      if (isValid(isoParsed)) {
        return isoParsed;
      }
    } catch {
      // fall through to other parsers
    }

    const dateOnlyMatch = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      if (isValid(parsed)) {
        return parsed;
      }
    }

    const formats =
      timePrecision === "DateTime"
        ? DATE_TIME_PARSE_FORMATS
        : DATE_ONLY_PARSE_FORMATS;

    for (const format of formats) {
      const parsed = parse(trimmed, format, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    }

    const nativeParsed = new Date(trimmed);
    if (isValid(nativeParsed) && trimmed.length >= 6) {
      return nativeParsed;
    }

    return null;
  }
}
