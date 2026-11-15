import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { TwitchAccountStatus } from "../types/twitch";

type Props = {
  account: TwitchAccountStatus | undefined;
  loading: boolean;
  disconnecting: boolean;
  onDisconnect: () => void;
};

const SIDE_LABEL = "font-mono text-fg-soft text-[11px] uppercase tracking-[0.22em]";

export function TwitchSessionStatusPanel({ account, loading, disconnecting, onDisconnect }: Props) {
  const linked = account?.linked === true;
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
              {linked ? m.ui_twitch_status_connected() : m.ui_twitch_status_disconnected()}
            </p>
            <p className="mt-2 text-fg-muted text-sm leading-6">
              {linked
                ? m.ui_twitch_status_connected_description()
                : m.ui_twitch_status_disconnected_description()}
            </p>
          </>
        )}
      </div>

      {linked && (
        <div className="flex items-center gap-3 border-border border-t pt-5">
          {account?.avatarUrl && (
            <img
              src={proxyImage(account.avatarUrl, "card")}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-fg text-sm">
              {account?.displayName ?? account?.login}
            </span>
            {account?.login && (
              <span className="truncate text-fg-soft text-xs">@{account.login}</span>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={loading || !linked || disconnecting}
        onClick={onDisconnect}
        className="h-10 w-full border border-border-strong bg-transparent px-4 text-fg-muted text-sm transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
      >
        {m.ui_disconnect()}
      </button>
    </aside>
  );
}
