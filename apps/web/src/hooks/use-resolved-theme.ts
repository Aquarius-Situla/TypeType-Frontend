import { useEffect, useState } from "react";
import {
  getSystemTheme,
  type ResolvedTheme,
  resolveEffectiveTheme,
  useThemeStore,
} from "../stores/theme-store";

export function useResolvedTheme(): ResolvedTheme {
  const theme = useThemeStore((state) => state.theme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(mediaQuery.matches ? "dark" : "light");
    update();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }
    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, [theme]);

  return theme === "system" ? systemTheme : resolveEffectiveTheme(theme);
}
