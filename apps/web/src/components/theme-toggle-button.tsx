import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";
import { type AppTheme, useThemeStore } from "../stores/theme-store";

type Props = {
  className?: string;
};

export function ThemeToggleButton({ className }: Props) {
  const { locale } = useInterfaceLocale();
  const isZh = locale.startsWith("zh");
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const options: { id: AppTheme; label: string; icon: React.ReactNode }[] = [
    {
      id: "system",
      label: isZh ? "跟随系统" : m.ui_system_mode(),
      icon: <Monitor className="size-4 shrink-0" aria-hidden="true" />,
    },
    {
      id: "light",
      label: isZh ? "浅色模式" : m.ui_light_mode(),
      icon: <Sun className="size-4 shrink-0 text-amber-500" aria-hidden="true" />,
    },
    {
      id: "dark",
      label: isZh ? "深色模式" : m.ui_dark_mode(),
      icon: <Moon className="size-4 shrink-0 text-sky-400" aria-hidden="true" />,
    },
  ];

  const currentLabel =
    theme === "system"
      ? isZh
        ? "跟随系统"
        : m.ui_system_mode()
      : theme === "light"
        ? isZh
          ? "浅色模式"
          : m.ui_light_mode()
        : isZh
          ? "深色模式"
          : m.ui_dark_mode();

  return (
    <div ref={rootRef} className="relative inline-block shrink-0">
      <button
        type="button"
        data-testid="theme-toggle-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${isZh ? "主题模式" : "Theme"}: ${currentLabel}`}
        title={`${isZh ? "主题模式" : "Theme"}: ${currentLabel}`}
        onClick={() => setOpen((current) => !current)}
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

      <div
        role="listbox"
        aria-label={isZh ? "主题模式" : "Theme"}
        className={`absolute right-0 top-full z-30 mt-1 w-36 origin-top-right rounded-sm border border-border-strong bg-app p-1 shadow-xl transition-[opacity,transform] duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="option"
            data-theme-option={option.id}
            aria-selected={theme === option.id}
            onClick={() => {
              setOpen(false);
              setTheme(option.id);
            }}
            className="flex min-h-9 w-full items-center gap-2.5 rounded-sm px-2 text-left text-xs text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            {option.icon}
            <span className="flex-1 font-medium">{option.label}</span>
            {theme === option.id && <Check className="size-3.5 text-fg" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
