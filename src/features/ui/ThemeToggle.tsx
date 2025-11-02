import { HiComputerDesktop, HiMoon, HiSun } from "react-icons/hi2";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  isExpanded: boolean;
}

export default function ThemeToggle({ isExpanded = true }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const handleClick = (newTheme: typeof theme) => {
    setTheme(newTheme);
  };

  const themes = [
    { value: "light" as const, icon: HiSun, label: "Light" },
    { value: "dark" as const, icon: HiMoon, label: "Dark" },
    { value: "system" as const, icon: HiComputerDesktop, label: "System" },
  ];

  if (!isExpanded) {
    // Collapsed view - show current theme icon as button
    const currentTheme = themes.find((t) => t.value === theme) || themes[2];
    const Icon = currentTheme.icon;

    return (
      <div className="flex flex-col gap-2">
        {themes.map((t) => {
          const ThemeIcon = t.icon;
          const isActive = theme === t.value;

          return (
            <button
              key={t.value}
              type="button"
              onClick={() => handleClick(t.value)}
              className={`flex items-center justify-center w-full py-2 rounded-2xl transition-colors cursor-pointer ${
                isActive
                  ? "bg-surface text-text"
                  : "text-text-muted hover:bg-surface hover:text-text"
              }`}
              title={t.label}
              aria-label={`Switch to ${t.label} theme`}>
              <ThemeIcon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    );
  }

  // Expanded view - show all options
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {themes.map((t) => {
          const Icon = t.icon;
          const isActive = theme === t.value;

          return (
            <button
              key={t.value}
              type="button"
              onClick={() => handleClick(t.value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-2xl transition-colors cursor-pointer ${
                isActive
                  ? "bg-surface text-text font-semibold"
                  : "text-text-muted hover:bg-surface hover:text-text"
              }`}
              aria-label={`Switch to ${t.label} theme`}>
              <Icon className="w-5 h-5" />
              <span className="text-xs">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
