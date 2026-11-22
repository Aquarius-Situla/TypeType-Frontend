import type { ReactElement } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  darkSurface: boolean;
  canAddStudy: boolean;
  addingStudy: boolean;
  alreadySubscribed: boolean;
  onRequestAddStudy: () => void;
  canCancelPending: boolean;
  cancellingPending: boolean;
  onCancelPending: () => void;
  canAllowOnce: boolean;
  allowOnceExhausted: boolean;
  requestingAllowOnce: boolean;
  onRequestAllowOnce: () => void;
};

export function FocusBlockedActions({
  darkSurface,
  canAddStudy,
  addingStudy,
  alreadySubscribed,
  onRequestAddStudy,
  canCancelPending,
  cancellingPending,
  onCancelPending,
  canAllowOnce,
  allowOnceExhausted,
  requestingAllowOnce,
  onRequestAllowOnce,
}: Props): ReactElement | null {
  if (!canAddStudy && !canCancelPending && !canAllowOnce) return null;

  const secondaryClass = darkSurface
    ? "cursor-pointer rounded-md border border-white/25 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
    : "cursor-pointer rounded-md border border-border-strong px-4 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface-strong disabled:opacity-50";

  const allowOnceDisabledClass = darkSurface
    ? "cursor-not-allowed rounded-md border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/40"
    : "cursor-not-allowed rounded-md bg-surface-strong px-4 py-1.5 text-sm font-medium text-fg-soft opacity-60";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${darkSurface ? "justify-center" : "justify-start"}`}
    >
      {canAddStudy && (
        <button
          type="button"
          disabled={addingStudy}
          onClick={onRequestAddStudy}
          className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            darkSurface
              ? "bg-white text-zinc-950 hover:bg-zinc-200"
              : "bg-fg text-app hover:bg-fg-strong"
          }`}
        >
          {addingStudy
            ? m.ui_adding()
            : alreadySubscribed
              ? m.focus_add_study_channel_only()
              : m.focus_add_study_channel()}
        </button>
      )}
      {canCancelPending && (
        <button
          type="button"
          disabled={cancellingPending}
          onClick={onCancelPending}
          className={secondaryClass}
        >
          {cancellingPending ? m.ui_saving() : m.focus_cancel_study_channel()}
        </button>
      )}
      {canAllowOnce && (
        <button
          type="button"
          disabled={allowOnceExhausted || requestingAllowOnce}
          onClick={onRequestAllowOnce}
          className={allowOnceExhausted ? allowOnceDisabledClass : secondaryClass}
        >
          {requestingAllowOnce ? m.ui_loading() : m.focus_allow_once()}
        </button>
      )}
    </div>
  );
}
