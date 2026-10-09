import { Monitor, Moon, Sun } from "lucide-react";
import { m } from "../paraglide/messages.js";
import { type AppTheme, getNextTheme, useThemeStore } from "../stores/theme-store";

type Props = {
  className?: string;
};

export function ThemeToggleButton({ className }: Props) {
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);

  const nextTheme = getNextTheme(theme);

  const getSwitchLabel = (target: AppTheme) => {
    switch (target) {
      case "system":
        return m.ui_switch_to_system_mode();
      case "light":
        return m.ui_switch_to_light_mode();
      case "dark":
        return m.ui_switch_to_dark_mode();
    }
  };

  const getModeLabel = (current: AppTheme) => {
    switch (current) {
      case "system":
        return m.ui_system_mode();
      case "light":
        return m.ui_light_mode();
      case "dark":
        return m.ui_dark_mode();
    }
  };

  const switchLabel = getSwitchLabel(nextTheme);
  const titleText = `${getModeLabel(theme)} (${switchLabel})`;

  return (
    <button
      type="button"
      data-testid="theme-toggle-button"
      onClick={cycleTheme}
      aria-label={switchLabel}
      title={titleText}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-fg transition-colors duration-200 hover:border-border hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong ${className ?? ""}`}
    >
      <span className="relative block h-4 w-4">
        <Monitor
          className={`absolute inset-0 h-4 w-4 transition-opacity duration-200 ${
            theme === "system" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        <Sun
          className={`absolute inset-0 h-4 w-4 transition-opacity duration-200 ${
            theme === "light" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
        <Moon
          className={`absolute inset-0 h-4 w-4 transition-opacity duration-200 ${
            theme === "dark" ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      </span>
    </button>
  );
}
