import { useUpdateUserSettings } from "@/features/users/hooks/useUserSettings";
import { useSyncExternalStore } from "react";
import { HiMoon, HiSun } from "react-icons/hi2";
import { useTheme } from "./theme-context";
import { ToggleButton } from "./button/toggle-button";

const subscribeToClient = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const updateSettings = useUpdateUserSettings();
  const isClient = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );

  if (!isClient) {
    // Return a placeholder that matches the expected size to prevent layout shift
    return <div className="w-11 h-6" />;
  }

  const isDark = resolvedTheme === "dark";
  const handleThemeChange = (checked: boolean) => {
    const theme = checked ? "dark" : "light";
    setTheme(theme);
    updateSettings.mutate({ theme });
  };

  return (
    <ToggleButton
      size="sm"
      checked={isDark}
      onChange={handleThemeChange}
      icon={{
        on: {
          icon: <HiMoon className="w-full h-full" />,
          className: "text-dark",
        },
        off: {
          icon: <HiSun className="w-full h-full" />,
          className: "text-warning",
        },
      }}
    />
  );
}
