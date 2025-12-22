export class LocaleHelpers {
  public static getLocale(): string {
    const defaultLocale = "nl-NL";

    try {
      if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
        const resolved = Intl.DateTimeFormat().resolvedOptions().locale;
        if (resolved) {
          return resolved;
        }
      }
      if (typeof navigator !== "undefined" && navigator.language) {
        return typeof navigator !== "undefined"
          ? navigator.language || navigator.languages?.[0] || defaultLocale
          : defaultLocale;
      }
    } catch (error) {
      // Silently fall back to default locale
    }

    return defaultLocale;
  }
}
