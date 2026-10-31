import {
  BILIBILI_BUFFER_BASELINE_SECONDS,
  BILIBILI_BUFFER_LEVELS,
  BILIBILI_CDN_REGIONS,
  type BilibiliBufferLevel,
  type BilibiliCdnRegion,
} from "../lib/bilibili-buffer";
import { m } from "../paraglide/messages.js";
import { useBilibiliBufferStore } from "../stores/bilibili-buffer-store";
import { PlaybackToggleRow } from "./settings-playback-row";

const BUFFER_LABELS: Record<BilibiliBufferLevel, () => string> = {
  saver: m.settings_bilibili_buffer_saver,
  normal: m.settings_bilibili_buffer_normal,
  large: m.settings_bilibili_buffer_large,
};

const BUFFER_HINTS: Record<BilibiliBufferLevel, () => string> = {
  saver: m.settings_bilibili_buffer_saver_hint,
  normal: m.settings_bilibili_buffer_normal_hint,
  large: m.settings_bilibili_buffer_large_hint,
};

const REGION_LABELS: Record<BilibiliCdnRegion, () => string> = {
  overseas: m.settings_bilibili_server_region_overseas,
  domestic: m.settings_bilibili_server_region_domestic,
};

const REGION_HINTS: Record<BilibiliCdnRegion, () => string> = {
  overseas: m.settings_bilibili_server_region_overseas_hint,
  domestic: m.settings_bilibili_server_region_domestic_hint,
};

export function SettingsBilibiliBuffer() {
  const level = useBilibiliBufferStore((state) => state.level);
  const setLevel = useBilibiliBufferStore((state) => state.setLevel);
  const serverRegion = useBilibiliBufferStore((state) => state.serverRegion);
  const setServerRegion = useBilibiliBufferStore((state) => state.setServerRegion);
  const concurrentPrefetch = useBilibiliBufferStore((state) => state.concurrentPrefetch);
  const setConcurrentPrefetch = useBilibiliBufferStore((state) => state.setConcurrentPrefetch);

  return (
    <div className="flex flex-col divide-y divide-border">
      <fieldset className="flex flex-col gap-3 py-4">
        <legend className="typetype-adaptive-label float-left mb-3 flex w-full min-w-0 flex-col gap-1">
          <span className="text-sm text-fg">{m.settings_bilibili_server_region_label()}</span>
          <span className="text-xs text-fg-soft">{m.settings_bilibili_server_region_description()}</span>
        </legend>
        <div className="clear-both grid gap-2 sm:grid-cols-2">
          {BILIBILI_CDN_REGIONS.map((region) => {
            const selected = region === serverRegion;
            return (
              <label
                key={region}
                className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                  selected ? "border-fg bg-fg/5" : "border-border-strong hover:border-fg-soft"
                }`}
              >
                <input
                  type="radio"
                  name="bilibili-server-region"
                  value={region}
                  checked={selected}
                  onChange={() => setServerRegion(region)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-fg">{REGION_LABELS[region]()}</span>
                <span className="text-xs text-fg-soft">{REGION_HINTS[region]()}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3 py-4">
        <legend className="typetype-adaptive-label float-left mb-3 flex w-full min-w-0 flex-col gap-1">
          <span className="text-sm text-fg">{m.settings_bilibili_buffer_label()}</span>
          <span className="text-xs text-fg-soft">{m.settings_bilibili_buffer_description()}</span>
        </legend>
        <div className="clear-both grid gap-2 sm:grid-cols-3">
          {BILIBILI_BUFFER_LEVELS.map((option) => {
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
                  name="bilibili-buffer"
                  value={option}
                  checked={selected}
                  onChange={() => setLevel(option)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-fg">{BUFFER_LABELS[option]()}</span>
                <span className="text-xs tabular-nums text-fg-muted">
                  {m.settings_bilibili_buffer_seconds({
                    seconds: BILIBILI_BUFFER_BASELINE_SECONDS[option],
                  })}
                </span>
                <span className="text-xs text-fg-soft">{BUFFER_HINTS[option]()}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <PlaybackToggleRow
        title={m.settings_bilibili_prefetch_label()}
        description={m.settings_bilibili_prefetch_description()}
        checked={concurrentPrefetch}
        onClick={() => setConcurrentPrefetch(!concurrentPrefetch)}
      />
    </div>
  );
}
