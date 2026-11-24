import { Eye, EyeOff } from "lucide-react";
import { useSettings } from "../hooks/use-settings";
import { m } from "../paraglide/messages.js";

export function SubscriptionWatchedToggle() {
  const { settings, settingsReady, update } = useSettings();
  const hidden = settings.hideWatchedSubscriptionVideos;
  const Icon = hidden ? EyeOff : Eye;
  return (
    <button
      type="button"
      aria-pressed={hidden}
      disabled={!settingsReady}
      onClick={() => update.mutate({ hideWatchedSubscriptionVideos: !hidden })}
      className="inline-flex h-9 items-center gap-2 border border-border-strong px-3 text-sm text-fg hover:bg-surface aria-pressed:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon size={16} aria-hidden="true" />
      {m.subscriptions_hide_watched()}
    </button>
  );
}
