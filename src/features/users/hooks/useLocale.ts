import { useUserSettings } from "@/features/users/hooks/useUserSettings";
import { getBrowserLanguage } from "@/features/users/utils/browser-defaults";
import { useMemo } from "react";

const DEFAULT_LANGUAGE = "nl-NL";

export function useLocale(): string {
  const { data: settings } = useUserSettings();

  return useMemo(() => {
    if (settings?.defaultLanguage) {
      return settings.defaultLanguage;
    }
    return getBrowserLanguage() || DEFAULT_LANGUAGE;
  }, [settings?.defaultLanguage]);
}
