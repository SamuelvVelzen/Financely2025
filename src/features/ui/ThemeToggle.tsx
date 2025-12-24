import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi2";
import { useTheme } from "./ThemeProvider";
import { ToggleButton } from "./button/toggle-button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder that matches the expected size to prevent layout shift
    return <div className="w-11 h-6" />;
  }

  const isDark = resolvedTheme === "dark";
  return (
    <ToggleButton
      size="sm"
      checked={isDark}
      onChange={(checked) => setTheme(checked ? "dark" : "light")}
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
