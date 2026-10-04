import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";
import type { Locale } from "../paraglide/runtime.js";

const OPTIONS: Locale[] = ["en", "zh", "fr", "de"];

function languageName(locale: Locale): string {
  if (locale === "zh") return "简体中文";
  if (locale === "fr") return m.language_french();
  if (locale === "de") return "Deutsch";
  return m.language_english();
}

function LanguageFlag({ locale }: { locale: Locale }) {
  if (locale === "zh") {
    return (
      <span
        className="relative flex h-4 w-6 shrink-0 items-center justify-center overflow-hidden rounded-[2px] bg-[#de2910] ring-1 ring-black/15"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 16" className="h-full w-full">
          <rect width="24" height="16" fill="#de2910" />
          <polygon
            points="5,2 6.2,5.8 9.8,5.8 6.8,8 7.9,11.8 5,9.5 2.1,11.8 3.2,8 0.2,5.8 3.8,5.8"
            fill="#ffde00"
            transform="scale(0.7) translate(1, 1)"
          />
        </svg>
      </span>
    );
  }
  if (locale === "de") {
    return (
      <span
        className="grid h-4 w-6 shrink-0 grid-rows-3 overflow-hidden rounded-[2px] ring-1 ring-black/15"
        aria-hidden="true"
      >
        <span className="bg-[#1f1f1f]" />
        <span className="bg-[#d21f26]" />
        <span className="bg-[#f5c542]" />
      </span>
    );
  }
  if (locale === "fr") {
    return (
      <span
        className="grid h-4 w-6 shrink-0 grid-cols-3 overflow-hidden rounded-[2px] ring-1 ring-black/15"
        aria-hidden="true"
      >
        <span className="bg-[#1b4fa3]" />
        <span className="bg-white" />
        <span className="bg-[#e33a3a]" />
      </span>
    );
  }
  return (
    <span
      className="relative h-4 w-6 shrink-0 overflow-hidden rounded-[2px] bg-white ring-1 ring-black/15"
      aria-hidden="true"
    >
      <span className="absolute left-0 top-[6px] h-1 w-full bg-[#d62828]" />
      <span className="absolute left-[10px] top-0 h-full w-1 bg-[#d62828]" />
    </span>
  );
}

export function InterfaceLanguagePicker() {
  const { locale, setLocale } = useInterfaceLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${m.settings_ui_language_label()}: ${languageName(locale)}`}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-10 items-center justify-center rounded-sm border border-transparent text-fg transition-colors hover:border-border hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-strong"
      >
        <LanguageFlag locale={locale} />
      </button>
      <div
        role="listbox"
        aria-label={m.settings_ui_language_label()}
        className={`absolute right-0 top-full z-30 mt-1 w-36 origin-top-right rounded-sm border border-border-strong bg-app p-1 shadow-xl transition-[opacity,transform] duration-150 ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            role="option"
            aria-selected={locale === option}
            onClick={() => {
              setOpen(false);
              void setLocale(option);
            }}
            className="flex min-h-9 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            <LanguageFlag locale={option} />
            <span data-interface-copy className="flex-1">
              {languageName(option)}
            </span>
            {locale === option && <Check className="size-3.5 text-fg" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}
