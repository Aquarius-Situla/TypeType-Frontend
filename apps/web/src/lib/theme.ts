import type { AppTheme, ResolvedTheme } from "../stores/theme-store";
import { resolveEffectiveTheme } from "../stores/theme-store";

const DARK_THEME_COLOR = "#09090b";
const LIGHT_THEME_COLOR = "#f4f4f5";

function themeColor(resolved: ResolvedTheme): string {
  return resolved === "light" ? LIGHT_THEME_COLOR : DARK_THEME_COLOR;
}

export function applyTheme(theme: AppTheme): void {
  if (typeof document === "undefined") return;
  const resolved = resolveEffectiveTheme(theme);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeColor(resolved));
  }
}
