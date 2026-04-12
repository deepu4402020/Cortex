import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

const STORAGE_KEY = "nb.theme";

export function useDarkMode() {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEY, "system"); // "light" | "dark" | "system"

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);

    root.classList.toggle("dark", Boolean(isDark));
  }, [theme]);

  return { theme, setTheme };
}

