import { RefreshCw } from "lucide-react";
import type { PortabilityCategory, PortabilityPreview } from "../lib/api-portability";
import { categoryLabel, FORMAT_NAMES } from "../lib/portability-catalog";
import { m } from "../paraglide/messages.js";
import { PortabilityFormatIcon } from "./portability-format-icon";

type Props = {
  preview: PortabilityPreview;
  applying: boolean;
  onReset: () => void;
};

export function PortabilityImportPreview({ preview, applying, onReset }: Props) {
  const counts = Object.entries(preview.counts) as [PortabilityCategory, number][];
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <PortabilityFormatIcon format={preview.detection.format} className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium text-fg">
              {FORMAT_NAMES[preview.detection.format] ?? preview.detection.format}
              {preview.detection.formatVersion ? ` ${preview.detection.formatVersion}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-fg-soft">
              {preview.duplicates.toLocaleString()} {m.portability_duplicate_records()}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-8 items-center gap-2 border border-border px-2.5 text-xs text-fg-muted hover:text-fg"
        >
          <RefreshCw size={13} /> {m.portability_different_file()}
        </button>
      </div>
      {counts.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {counts.map(([category, count]) => (
            <div key={category} className="border border-border bg-surface px-3 py-2">
              <dt className="truncate text-xs text-fg-soft">{categoryLabel(category)}</dt>
              <dd className="mt-0.5 font-mono text-sm text-fg">{count.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      )}
      {preview.issues.length > 0 && (
        <div className="border border-warning/40 bg-warning/5 px-3 py-3">
          <p className="text-xs font-medium text-fg">{m.portability_compatibility_notes()}</p>
          <ul className="mt-2 space-y-1 text-xs text-fg-muted">
            {preview.issues.map((issue) => (
              <li key={`${issue.category}-${issue.code}`}>
                {issue.message}
                {issue.count > 1 ? ` (${issue.count})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-t border-border pt-4 text-xs text-fg-muted">
        <span className={applying ? "animate-pulse" : undefined}>
          {m.portability_auto_import_starting()}
        </span>
      </div>
    </section>
  );
}
