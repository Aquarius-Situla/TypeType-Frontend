import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PortabilityFormatDescriptor } from "../lib/api-portability";
import { FORMAT_NAMES } from "../lib/portability-catalog";
import { m } from "../paraglide/messages.js";
import { PortabilityFormatIcon } from "./portability-format-icon";

type FormatOption = Pick<PortabilityFormatDescriptor, "format" | "defaultExtension">;

type Props = {
  label: string;
  formats: FormatOption[];
  value: string;
  onChange: (format: string) => void;
};

export function PortabilityFormatPicker({ label, formats, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = formats.find((format) => format.format === value) ?? formats[0];
  const formatName = (format: string) =>
    format === "auto" ? m.portability_auto_detect() : (FORMAT_NAMES[format] ?? format);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", closeOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("mousedown", closeOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!selected) return null;
  return (
    <div ref={root} className="relative flex flex-col gap-2">
      <span className="text-xs font-medium uppercase text-fg-soft">{label}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center gap-3 border border-border bg-surface px-3 text-left hover:border-fg-soft"
      >
        <PortabilityFormatIcon format={selected.format} className="h-6 w-6 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm text-fg">
          {formatName(selected.format)}
        </span>
        {selected.defaultExtension && (
          <span className="text-xs text-fg-soft">.{selected.defaultExtension}</span>
        )}
        <ChevronDown size={15} className="shrink-0 text-fg-soft" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-80 overflow-y-auto border border-border-strong bg-surface p-1 shadow-2xl"
        >
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {formats.map((format) => {
              const active = format.format === selected.format;
              return (
                <button
                  key={format.format}
                  type="button"
                  onClick={() => {
                    onChange(format.format);
                    setOpen(false);
                  }}
                  className={`flex min-h-12 items-center gap-3 px-3 py-2 text-left ${
                    active ? "bg-surface-strong text-fg" : "text-fg-muted hover:bg-surface-soft"
                  }`}
                >
                  <PortabilityFormatIcon format={format.format} className="h-6 w-6 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {formatName(format.format)}
                    </span>
                    {format.defaultExtension && (
                      <span className="block text-xs text-fg-soft">.{format.defaultExtension}</span>
                    )}
                  </span>
                  {active && <Check size={15} className="shrink-0" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
