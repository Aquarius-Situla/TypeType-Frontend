import { m } from "../paraglide/messages.js";

export function TwitchLiveFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-strong text-center">
      <p className="font-semibold text-fg">{m.twitch_live_failed()}</p>
      <button
        type="button"
        onClick={onRetry}
        className="cursor-pointer rounded-lg bg-[#9146ff] px-3 py-1.5 font-medium text-sm text-white hover:bg-[#772ce8]"
      >
        {m.ui_retry()}
      </button>
    </div>
  );
}
