import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { ThemeContext, type ITheme } from "./theme-context";

const THEME_STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialTheme(): ITheme {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "system";
}

const subscribeToClient = () => () => {};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ITheme>(getInitialTheme);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false
  );
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined" ? getSystemTheme() : "light"
  );

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const root = document.documentElement;
    const resolved = theme === "system" ? systemTheme : theme;

    if (resolved === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, systemTheme, isClient]);

  const setTheme = useCallback((newTheme: ITheme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  }, []);

  useEffect(() => {
    if (!isClient || theme !== "system" || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const newSystemTheme = getSystemTheme();
      setSystemTheme(newSystemTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, isClient]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
