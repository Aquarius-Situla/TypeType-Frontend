import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/use-settings";
import { DEFAULT_PLAYBACK_SPEED_OPTIONS, playbackSpeedLabel } from "../lib/playback-speed";
import { m } from "../paraglide/messages.js";
import { PLAYBACK_ROW, PlaybackNumberRow, PlaybackToggleRow } from "./settings-playback-row";

const SECTION_LABEL = "text-xs font-medium text-fg-soft uppercase tracking-wider px-1";
const GROUP = "divide-y divide-border border-y border-border";

function qualityOptions() {
  return [
    { label: m.ui_auto(), value: "auto" },
    ...["144p", "240p", "360p", "480p", "720p", "1080p", "1440p", "2160p"].map((quality) => ({
      label: quality,
      value: quality,
    })),
  ];
}

type DropdownProps = {
  value: string;
  onChange: (q: string) => void;
};

type SpeedDropdownProps = {
  value: number;
  onChange: (speed: number) => void;
};

function QualityDropdown({ value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative ml-0 shrink-0 sm:ml-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="typetype-adaptive-control flex min-h-9 max-w-full items-center justify-center gap-2 rounded-sm border border-border-strong bg-app px-3 py-1.5 text-xs text-fg transition-colors hover:border-fg-soft"
      >
        {value === "auto" ? m.ui_auto() : value}
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[72px] overflow-hidden rounded-sm border border-border-strong bg-app shadow-lg">
          {qualityOptions().map((quality) => (
            <button
              key={quality.value}
              type="button"
              onClick={() => {
                onChange(quality.value);
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-xs transition-colors ${
                quality.value === value
                  ? "bg-surface text-fg"
                  : "text-fg-muted hover:bg-surface hover:text-fg"
              }`}
            >
              {quality.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpeedDropdown({ value, onChange }: SpeedDropdownProps) {
  return (
    <select
      aria-label={m.ui_default_playback_speed()}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="typetype-adaptive-control ml-0 max-w-full shrink-0 rounded-sm border border-border-strong bg-app px-3 py-1.5 text-xs text-fg transition-colors hover:border-fg-soft sm:ml-6"
    >
      {DEFAULT_PLAYBACK_SPEED_OPTIONS.map((speed) => (
        <option key={speed} value={speed}>
          {playbackSpeedLabel(speed)}
        </option>
      ))}
    </select>
  );
}

export function SettingsPlayback() {
  const { settings, update } = useSettings();
  const autoplayCountdownSeconds = Math.min(
    60,
    Math.max(0, Math.round(settings.autoplayCountdownSeconds)),
  );

  return (
    <section className="flex flex-col gap-3">
      <p className={SECTION_LABEL}>{m.settings_playback_label()}</p>
      <div className={GROUP}>
        <PlaybackToggleRow
          title={m.watch_autoplay()}
          description={m.ui_automatically_play_the_next_video()}
          checked={settings.autoplay}
          onClick={() => update.mutate({ autoplay: !settings.autoplay })}
        />
        <PlaybackNumberRow
          title={m.ui_autoplay_countdown()}
          description={m.ui_seconds_before_autoplay_advances_or_0_for_immediate_playlists()}
          value={autoplayCountdownSeconds}
          min={0}
          max={60}
          onChange={(value) =>
            update.mutate({ autoplayCountdownSeconds: Math.min(60, Math.max(0, value)) })
          }
        />
        <PlaybackToggleRow
          title={m.ui_skip_playlist_autoplay_screen()}
          description={m.ui_play_next_playlist_item_immediately_while_keeping_the_countdown_for_recommendations()}
          checked={settings.skipPlaylistAutoplayScreen}
          onClick={() =>
            update.mutate({ skipPlaylistAutoplayScreen: !settings.skipPlaylistAutoplayScreen })
          }
        />
        <PlaybackToggleRow
          title={m.ui_hide_upcoming_playlist_videos()}
          description={m.ui_hide_upcoming_playlist_description()}
          checked={settings.hideUpcomingPlaylistVideos}
          onClick={() =>
            update.mutate({ hideUpcomingPlaylistVideos: !settings.hideUpcomingPlaylistVideos })
          }
        />
        <PlaybackToggleRow
          title={m.ui_audio_only_playback()}
          description={m.ui_load_a_backend_provided_audio_stream_when_available()}
          checked={settings.audioOnlyPlayback}
          onClick={() => update.mutate({ audioOnlyPlayback: !settings.audioOnlyPlayback })}
        />
        <div className={PLAYBACK_ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{m.ui_default_quality()}</span>
            <span className="text-xs text-fg-soft">{m.ui_preferred_video_resolution()}</span>
          </div>
          <QualityDropdown
            value={settings.defaultQuality}
            onChange={(q) => update.mutate({ defaultQuality: q })}
          />
        </div>
        <div className={PLAYBACK_ROW}>
          <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm text-fg">{m.ui_default_playback_speed()}</span>
            <span className="text-xs text-fg-soft">{m.ui_applied_when_a_video_starts()}</span>
          </div>
          <SpeedDropdown
            value={settings.defaultPlaybackSpeed}
            onChange={(speed) => update.mutate({ defaultPlaybackSpeed: speed })}
          />
        </div>
      </div>
    </section>
  );
}
