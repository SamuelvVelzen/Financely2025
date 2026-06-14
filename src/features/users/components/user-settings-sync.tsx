import { useTheme } from "@/features/ui/ThemeProvider";
import { LocaleHelpers } from "@/features/util/locale.helpers";
import { useUserSettings } from "@/features/users/hooks/useUserSettings";
import { resolveUserTheme } from "@/features/users/utils/resolve-user-theme";
import { useEffect } from "react";

/**
 * Syncs persisted user settings (theme, locale) into client runtime on load.
 */
export function UserSettingsSync() {
  const { data: settings } = useUserSettings();
  const { setTheme } = useTheme();

  useEffect(() => {
    LocaleHelpers.setUserLocaleOverride(settings?.defaultLanguage ?? null);
  }, [settings?.defaultLanguage]);

  useEffect(() => {
    setTheme(resolveUserTheme(settings ?? null));
  }, [settings, setTheme]);

  return null;
}
