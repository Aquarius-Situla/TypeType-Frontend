import type { YoutubeSessionState } from "../lib/api-youtube-session";
import {
  formatSessionTime,
  youtubeSessionStatusDescription,
  youtubeSessionStatusLabel,
} from "../lib/youtube-session-format";
import { m } from "../paraglide/messages.js";

type Props = {
  state: YoutubeSessionState | undefined;
  loading: boolean;
  canDisconnect: boolean;
  onDisconnect: () => void;
};

const SIDE_LABEL = "font-mono text-fg-soft text-[11px] uppercase tracking-[0.22em]";

export function YoutubeSessionStatusPanel({ state, loading, canDisconnect, onDisconnect }: Props) {
  return (
    <aside className="flex flex-col justify-center gap-5 border-border lg:border-l lg:pl-8">
      <div>
        <p className={SIDE_LABEL}>{m.admin_users_column_status()}</p>
        {loading ? (
          <div className="mt-2 flex flex-col gap-2">
            <div className="h-7 w-28 animate-pulse rounded bg-surface-soft" />
            <div className="h-5 w-52 animate-pulse rounded bg-surface-soft" />
          </div>
        ) : (
          <>
            <p className="mt-2 font-semibold text-fg text-lg">
              {youtubeSessionStatusLabel(state?.status)}
            </p>
            <p className="mt-2 text-fg-muted text-sm leading-6">
              {youtubeSessionStatusDescription(state?.status)}
            </p>
          </>
        )}
      </div>

      <dl className="flex flex-col gap-4 border-border border-t pt-5">
        <div>
          <dt className="text-fg-soft text-xs">{m.ui_last_used()}</dt>
          <dd className="mt-1 text-fg text-sm">
            {loading ? (
              <span className="inline-block h-4 w-28 animate-pulse rounded bg-surface-soft" />
            ) : (
              formatSessionTime(state?.lastUsedAt)
            )}
          </dd>
        </div>
        <div>
          <dt className="text-fg-soft text-xs">{m.ui_updated()}</dt>
          <dd className="mt-1 text-fg text-sm">
            {loading ? (
              <span className="inline-block h-4 w-28 animate-pulse rounded bg-surface-soft" />
            ) : (
              formatSessionTime(state?.updatedAt)
            )}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        disabled={loading || !canDisconnect}
        onClick={onDisconnect}
        className="h-10 w-full border border-border-strong bg-transparent px-4 text-fg-muted text-sm transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
      >
        {m.ui_disconnect()}
      </button>
    </aside>
  );
}
