import type { ITheme, IUserSetting } from "@/features/shared/validation/schemas";

const THEME_STORAGE_KEY = "theme";

export function resolveUserTheme(
  setting: IUserSetting | null | undefined,
): ITheme {
  if (setting?.theme) {
    return setting.theme;
  }
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  }
  return "system";
}
