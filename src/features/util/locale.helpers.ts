export class LocaleHelpers {
  private static userLocaleOverride: string | null = null;

  public static setUserLocaleOverride(locale: string | null): void {
    LocaleHelpers.userLocaleOverride = locale;
  }

  public static getLocale(override?: string): string {
    if (override) {
      return override;
    }
    if (LocaleHelpers.userLocaleOverride) {
      return LocaleHelpers.userLocaleOverride;
    }

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
    } catch {
      // Silently fall back to default locale
    }

    return defaultLocale;
  }
}
