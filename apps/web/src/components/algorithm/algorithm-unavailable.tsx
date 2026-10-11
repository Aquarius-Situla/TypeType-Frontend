import { m } from "../../paraglide/messages.js";

export function Unavailable({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  return (
    <div className="flex flex-col items-start gap-3 px-1">
      <p className="text-sm leading-6 text-fg-muted">{m.algo_profile_unavailable()}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="h-9 rounded-sm border border-border-strong px-4 text-sm text-fg transition-colors hover:bg-surface-strong disabled:cursor-not-allowed disabled:text-fg-soft"
      >
        {retrying ? m.ui_loading() : m.ui_retry()}
      </button>
    </div>
  );
}
