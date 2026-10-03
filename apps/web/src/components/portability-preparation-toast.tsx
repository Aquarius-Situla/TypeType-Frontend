import { LoaderCircle } from "lucide-react";
import type { PortabilityPreparationProgress } from "../lib/portability-preparation-progress";
import { m } from "../paraglide/messages.js";
import { getLocale, type Locale } from "../paraglide/runtime.js";
import "../styles/notification-toast.css";

function phaseLabel(phase: PortabilityPreparationProgress["phase"], locale: Locale): string {
  if (phase === "scanning") return m.portability_prepare_scanning({}, { locale });
  if (phase === "extracting") return m.portability_prepare_extracting({}, { locale });
  if (phase === "packing") return m.portability_prepare_packing({}, { locale });
  return m.portability_prepare_uploading({}, { locale });
}

function progressPercent(progress: PortabilityPreparationProgress): number | null {
  if (!progress.total || progress.total <= 0) return null;
  return Math.min(100, Math.round((progress.processed / progress.total) * 100));
}

function byteCount(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: "byte",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function PortabilityPreparationToast({
  progress,
}: {
  progress: PortabilityPreparationProgress;
}) {
  const locale = getLocale();
  const detail = phaseLabel(progress.phase, locale);
  const percent = progressPercent(progress);
  const amount =
    progress.total === null
      ? null
      : m.portability_progress_of(
          {
            processed: byteCount(progress.processed, locale),
            total: byteCount(progress.total, locale),
          },
          { locale },
        );

  return (
    <aside
      role="status"
      aria-live="polite"
      className="notification-toast portability-progress-toast"
    >
      <div className="flex items-center gap-2.5 p-2">
        <LoaderCircle size={17} className="shrink-0 animate-spin text-accent" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[10px] font-semibold uppercase text-accent">
            {m.portability_import_title({}, { locale })}
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-medium leading-tight text-fg">
            {detail}
          </span>
          {amount && <span className="mt-1 block text-[11px] text-fg-muted">{amount}</span>}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden bg-surface-strong"
        role="progressbar"
        aria-label={detail}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
      >
        <div
          className={
            "h-full bg-accent transition-[width] duration-300 " +
            (percent === null ? "w-1/3 animate-pulse" : "")
          }
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>
    </aside>
  );
}
