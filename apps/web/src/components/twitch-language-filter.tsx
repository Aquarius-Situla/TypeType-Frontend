import { ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { languageLabel, TWITCH_LANGUAGES } from "../lib/twitch-language";
import { m } from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";
import { useTwitchLanguageStore } from "../stores/twitch-language-store";

const MARGIN = 8;

export function TwitchLanguageFilter() {
  const languages = useTwitchLanguageStore((state) => state.languages);
  const toggle = useTwitchLanguageStore((state) => state.toggle);
  const clear = useTwitchLanguageStore((state) => state.clear);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  const locale = getLocale();
  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "language" });
    return TWITCH_LANGUAGES.map((code) => ({
      code,
      label: languageLabel(code, locale, m.twitch_language_other(), names),
    })).sort((a, b) =>
      a.code === "OTHER" ? 1 : b.code === "OTHER" ? -1 : a.label.localeCompare(b.label, locale),
    );
  }, [locale]);
  const summary =
    languages.length === 0
      ? m.twitch_language_all()
      : languages.length === 1
        ? (options.find((option) => option.code === languages[0])?.label ?? languages[0])
        : m.twitch_language_count({ count: languages.length });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !panelRef.current) return;
    const anchor = anchorRef.current.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const left = Math.max(MARGIN, Math.min(anchor.right - panel.width, vw - panel.width - MARGIN));
    const spaceBelow = vh - anchor.bottom - MARGIN;
    const top = Math.max(
      MARGIN,
      Math.min(
        spaceBelow >= panel.height ? anchor.bottom + MARGIN : anchor.top - panel.height - MARGIN,
        vh - panel.height - MARGIN,
      ),
    );
    setPanelStyle({ position: "fixed", top, left, visibility: "visible" });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      anchorRef.current?.focus();
    }
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 font-medium text-fg text-xs transition-colors hover:bg-surface-strong"
      >
        <span className="text-fg-muted">{m.twitch_language_filter()}</span>
        <span>{summary}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-fg-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="fixed z-50 flex max-h-80 w-60 flex-col overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl"
          >
            <button
              type="button"
              onClick={clear}
              disabled={languages.length === 0}
              className="cursor-pointer border-border border-b px-3 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-strong disabled:cursor-default disabled:text-fg-muted disabled:hover:bg-transparent"
            >
              {m.twitch_language_all()}
            </button>
            <div className="overflow-y-auto py-1">
              {options.map((option) => (
                <label
                  key={option.code}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-fg text-sm hover:bg-surface-strong"
                >
                  <input
                    type="checkbox"
                    checked={languages.includes(option.code)}
                    onChange={() => toggle(option.code)}
                    className="accent-[#9146ff]"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
