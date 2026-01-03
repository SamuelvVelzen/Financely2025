import type { ITimePrecision } from "@/features/shared/validation/schemas";
import { LocaleHelpers } from "../locale.helpers";

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
}
