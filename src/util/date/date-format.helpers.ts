import { LocaleHelpers } from "../locale.helpers";

export class DateFormatHelpers {
  public static formatIsoStringToString(isoString: string): string {
    const local = LocaleHelpers.getLocale();

    return new Date(isoString).toLocaleDateString(local, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
