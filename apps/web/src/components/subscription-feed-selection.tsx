import { m } from "../paraglide/messages.js";

type Props = {
  selecting: boolean;
  selectedCount: number;
  pending: boolean;
  onStart: () => void;
  onSelectAll: () => void;
  onMark: (watched: boolean) => void;
  onCancel: () => void;
};

const BUTTON =
  "h-9 border border-border-strong px-3 text-sm text-fg hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40";

export function SubscriptionFeedSelection({
  selecting,
  selectedCount,
  pending,
  onStart,
  onSelectAll,
  onMark,
  onCancel,
}: Props) {
  if (!selecting) {
    return (
      <button type="button" onClick={onStart} className={BUTTON}>
        {m.subscriptions_select()}
      </button>
    );
  }
  const none = selectedCount === 0 || pending;
  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar">
      <span className="text-sm text-fg-muted" aria-live="polite">
        {m.subscriptions_selected_count({ count: selectedCount })}
      </span>
      <button type="button" onClick={onSelectAll} disabled={pending} className={BUTTON}>
        {m.subscriptions_select_all()}
      </button>
      <button type="button" onClick={() => onMark(true)} disabled={none} className={BUTTON}>
        {m.ui_mark_as_watched()}
      </button>
      <button type="button" onClick={() => onMark(false)} disabled={none} className={BUTTON}>
        {m.ui_mark_as_unwatched()}
      </button>
      <button type="button" onClick={onCancel} disabled={pending} className={BUTTON}>
        {m.ui_cancel()}
      </button>
    </div>
  );
}
