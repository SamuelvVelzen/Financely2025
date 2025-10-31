import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with safe defaults that work on both server and client
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    }
    return "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme to HTML element whenever theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Get system preference
    const getSystemTheme = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const resolved = theme === "system" ? getSystemTheme() : theme;

    console.log("Applying theme:", {
      theme,
      resolved,
      currentClasses: root.classList.toString(),
    });

    if (resolved === "dark") {
      root.classList.add("dark");
      console.log("Added dark class, new classes:", root.classList.toString());
    } else {
      root.classList.remove("dark");
      console.log(
        "Removed dark class, new classes:",
        root.classList.toString()
      );
    }

    setResolvedTheme(resolved);
  }, [theme]);

  // Set theme and save to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    console.log("setTheme called with:", newTheme);
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
  }, []);

  // Initialize theme on mount - read from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = (localStorage.getItem("theme") as Theme) || "system";
    if (savedTheme !== theme) {
      setThemeState(savedTheme);
    }
  }, []);

  // Listen for system preference changes when theme is "system"
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;

    const getSystemTheme = (): "light" | "dark" => {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    };

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Reapply system theme when preference changes
      const resolved = getSystemTheme();
      const root = document.documentElement;
      if (resolved === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      setResolvedTheme(resolved);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Always provide the context, even during SSR
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
