import { useSettings } from "../hooks/use-settings";
import { m } from "../paraglide/messages.js";
import { PLAYBACK_ROW } from "./settings-playback-row";

const THRESHOLDS = [0, 50, 60, 70, 80, 90, 95, 100];

function thresholdLabel(percent: number): string {
  return percent === 0
    ? m.settings_watched_threshold_default()
    : m.settings_watched_threshold_percent({ percent });
}

export function SettingsWatchedThreshold() {
  const { settings, update } = useSettings();
  const value = THRESHOLDS.includes(settings.watchedThresholdPercent)
    ? settings.watchedThresholdPercent
    : 0;
  return (
    <div className={PLAYBACK_ROW}>
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm text-fg">{m.settings_watched_threshold_title()}</span>
        <span className="text-xs text-fg-soft">{m.settings_watched_threshold_description()}</span>
      </div>
      <select
        aria-label={m.settings_watched_threshold_title()}
        value={value}
        onChange={(event) => update.mutate({ watchedThresholdPercent: Number(event.target.value) })}
        className="typetype-adaptive-control ml-0 max-w-full shrink-0 rounded-sm border border-border-strong bg-app px-3 py-1.5 text-xs text-fg transition-colors hover:border-fg-soft sm:ml-6"
      >
        {THRESHOLDS.map((percent) => (
          <option key={percent} value={percent}>
            {thresholdLabel(percent)}
          </option>
        ))}
      </select>
    </div>
  );
}
