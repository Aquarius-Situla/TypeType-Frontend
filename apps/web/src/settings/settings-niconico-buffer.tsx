import {
  NICONICO_BUFFER_BASELINE_SECONDS,
  NICONICO_BUFFER_LEVELS,
  type NiconicoBufferLevel,
} from "../lib/niconico-buffer";
import { m } from "../paraglide/messages.js";
import { useNiconicoBufferStore } from "../stores/niconico-buffer-store";

const LABELS: Record<NiconicoBufferLevel, () => string> = {
  saver: m.settings_niconico_buffer_saver,
  normal: m.settings_niconico_buffer_normal,
  large: m.settings_niconico_buffer_large,
};

const HINTS: Record<NiconicoBufferLevel, () => string> = {
  saver: m.settings_niconico_buffer_saver_hint,
  normal: m.settings_niconico_buffer_normal_hint,
  large: m.settings_niconico_buffer_large_hint,
};

export function SettingsNiconicoBuffer() {
  const level = useNiconicoBufferStore((state) => state.level);
  const setLevel = useNiconicoBufferStore((state) => state.setLevel);

  return (
    <fieldset className="flex flex-col gap-3 py-4">
      <legend className="typetype-adaptive-label float-left mb-3 flex w-full min-w-0 flex-col gap-1">
        <span className="text-sm text-fg">{m.settings_niconico_buffer_label()}</span>
        <span className="text-xs text-fg-soft">{m.settings_niconico_buffer_description()}</span>
      </legend>
      <div className="clear-both grid gap-2 sm:grid-cols-3">
        {NICONICO_BUFFER_LEVELS.map((option) => {
          const selected = option === level;
          return (
            <label
              key={option}
              className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                selected ? "border-fg bg-fg/5" : "border-border-strong hover:border-fg-soft"
              }`}
            >
              <input
                type="radio"
                name="niconico-buffer"
                value={option}
                checked={selected}
                onChange={() => setLevel(option)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-fg">{LABELS[option]()}</span>
              <span className="text-xs tabular-nums text-fg-muted">
                {m.settings_niconico_buffer_seconds({
                  seconds: NICONICO_BUFFER_BASELINE_SECONDS[option],
                })}
              </span>
              <span className="text-xs text-fg-soft">{HINTS[option]()}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
