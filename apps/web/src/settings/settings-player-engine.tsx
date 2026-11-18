import { useState } from "react";
import { ReportBugModal } from "../components/report-bug-modal";
import { useSettings } from "../hooks/use-settings";
import { m } from "../paraglide/messages.js";
import type { PlayerEngine } from "../types/user";

const OPTIONS: { value: PlayerEngine; label: () => string }[] = [
  { value: "vidstack", label: m.settings_player_engine_vidstack },
  { value: "videojs", label: m.settings_player_engine_videojs },
];

const optionClass =
  "cursor-pointer rounded-full px-3 py-1.5 text-sm ring-1 ring-border-strong transition-colors has-[:checked]:bg-fg has-[:checked]:text-app has-[:checked]:ring-fg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent";

export function SettingsPlayerEngine() {
  const { settings, update } = useSettings();
  const [reporting, setReporting] = useState(false);
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="typetype-adaptive-label flex min-w-0 flex-col gap-1">
        <span className="text-sm text-fg">{m.settings_player_engine_label()}</span>
        <span className="text-xs text-fg-soft">{m.settings_player_engine_description()}</span>
      </div>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">{m.settings_player_engine_label()}</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} className={optionClass}>
            <input
              type="radio"
              name="player-engine"
              value={option.value}
              checked={settings.playerEngine === option.value}
              onChange={() => update.mutate({ playerEngine: option.value })}
              className="sr-only"
            />
            {option.label()}
          </label>
        ))}
        <button
          type="button"
          onClick={() => setReporting(true)}
          className="ml-auto text-fg-soft text-sm underline-offset-4 hover:text-fg hover:underline"
        >
          {m.ui_report_bug()}
        </button>
      </fieldset>
      {reporting && (
        <ReportBugModal
          playerState={{ engine: settings.playerEngine }}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
