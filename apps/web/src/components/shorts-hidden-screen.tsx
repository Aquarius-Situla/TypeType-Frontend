import { goto } from "../lib/route-redirect";
import { m } from "../paraglide/messages.js";

export function ShortsHiddenScreen() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 px-5 py-6 text-center">
        <h1 className="text-base font-semibold text-fg">{m.ui_shorts_are_hidden()}</h1>
        <p className="text-sm text-fg-soft">
          {m.ui_you_can_re_enable_shorts_from_video_preferences()}
        </p>
        <button
          type="button"
          onClick={() => goto("/settings")}
          className="mt-1 h-9 rounded-lg bg-fg px-4 text-sm font-medium text-app transition-opacity hover:opacity-90"
        >
          {m.ui_open_settings()}
        </button>
      </div>
    </div>
  );
}
