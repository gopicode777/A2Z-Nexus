import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "a2z-nexus-theme";

function getPreferredTheme() {
  if (typeof window === "undefined") return "light";

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // localStorage unavailable — fall through to default
  }

  // Always default to light mode on first visit, regardless of the
  // device/browser's system color-scheme preference. The user can still
  // switch to dark mode manually, and that choice will be remembered.
  return "light";
}

/**
 * Frontend-only theme provider. Toggles the `dark` class on <html> so every
 * Tailwind `dark:` utility across the app responds, and persists the choice
 * in localStorage. Purely presentational — no backend/API involvement.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore write failures (private browsing, etc.)
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
