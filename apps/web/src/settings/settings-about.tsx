import { ExternalLink, RefreshCw } from "lucide-react";
import { useVersionInfo } from "../hooks/use-version-info";
import type { ComponentVersion, VersionComponent } from "../lib/api-version";
import { m } from "../paraglide/messages.js";

const OPTIONAL: ReadonlySet<VersionComponent> = new Set(["recommender"]);

const components = (): { key: VersionComponent; label: string }[] => [
  { key: "frontend", label: "Frontend" },
  { key: "server", label: "Server" },
  { key: "token", label: "Token" },
  { key: "downloader", label: "Downloader" },
  { key: "recommender", label: m.nav_algorithm() },
];

function VersionDetails({ version }: { version: ComponentVersion | null }) {
  if (!version) return <span className="text-xs text-fg-soft">{m.ui_unavailable()}</span>;
  return (
    <div className="min-w-0 text-right">
      <p className="text-sm text-fg">{version.version}</p>
      <p className="break-all font-mono text-xs text-fg-soft">{version.revision}</p>
      <p className="text-xs text-fg-soft">{version.buildTime}</p>
    </div>
  );
}

export function SettingsAbout() {
  const query = useVersionInfo();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-medium text-fg-soft uppercase tracking-wider">
          {m.ui_versions()}
        </p>
        <button
          type="button"
          title={m.ui_refresh_versions()}
          aria-label={m.ui_refresh_versions()}
          disabled={query.isFetching}
          onClick={() => query.refetch()}
          className="flex size-8 items-center justify-center rounded-md text-fg-soft transition-colors hover:bg-surface-strong hover:text-fg disabled:cursor-wait disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="divide-y divide-border border-y border-border">
        {components()
          .filter(({ key }) => !OPTIONAL.has(key) || query.data?.[key])
          .map(({ key, label }) => (
            <div key={key} className="flex min-h-20 items-start justify-between gap-4 px-4 py-3.5">
              <span className="pt-0.5 text-sm text-fg">{label}</span>
              {query.isPending ? (
                <span className="text-xs text-fg-soft">{m.ui_loading()}</span>
              ) : (
                <VersionDetails version={query.data?.[key] ?? null} />
              )}
            </div>
          ))}
      </div>
      <a
        href="/THIRD_PARTY_NOTICES.txt"
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-10 items-center gap-2 self-start text-sm text-fg-muted transition-colors hover:text-fg"
      >
        {m.ui_third_party_notices()}
        <ExternalLink className="size-4" aria-hidden="true" />
      </a>
    </section>
  );
}
