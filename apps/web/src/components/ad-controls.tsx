import {
  Download,
  Maximize,
  Pause,
  Play,
  RectangleHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { ReactNode } from "react";
import { AD_BUTTON, AD_CHIP } from "../lib/ad-player";
import { m } from "../paraglide/messages.js";
import { useWatchLayoutStore } from "../stores/watch-layout-store";
import { AdSlider } from "./ad-slider";
import { type AdSubtitles, AdSubtitlesButton } from "./ad-subtitles";

type Props = {
  shown: boolean;
  label: string;
  brand: string;
  elapsed: number;
  duration: number;
  paused: boolean;
  muted: boolean;
  volume: number;
  subtitles: AdSubtitles;
  onTogglePause?: () => void;
  onToggleMute: () => void;
  onVolume: (volume: number) => void;
  onSeek?: (seconds: number) => void;
  onFullscreen: () => void;
  replay: boolean;
  download?: { href: string; name: string };
  tools?: ReactNode;
};

function adClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume === 0) return <VolumeX className="h-4 w-4" aria-hidden="true" />;
  if (volume < 0.5) return <Volume1 className="h-4 w-4" aria-hidden="true" />;
  return <Volume2 className="h-4 w-4" aria-hidden="true" />;
}

// The control bar of an ad: what the ad allows of the player controls, along its bottom edge.
export function AdControls({
  shown,
  label,
  brand,
  elapsed,
  duration,
  paused,
  muted,
  volume,
  subtitles,
  onTogglePause,
  onToggleMute,
  onVolume,
  onSeek,
  onFullscreen,
  replay,
  download,
  tools,
}: Props) {
  const cinemaMode = useWatchLayoutStore((state) => state.cinemaMode);
  const toggleCinemaMode = useWatchLayoutStore((state) => state.toggleCinemaMode);
  const left = duration - elapsed;
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      {onSeek && duration > 0 && (
        <AdSlider
          label={m.player_seek()}
          value={elapsed}
          max={duration}
          step={0.1}
          valueText={`${adClock(elapsed)} / ${adClock(duration)}`}
          onChange={onSeek}
          className="mb-2"
        />
      )}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onTogglePause && (
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={paused ? m.player_play() : m.player_pause()}
            className={AD_BUTTON}
          >
            {paused ? (
              <Play className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Pause className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
        <div className={`group/volume flex h-9 shrink-0 items-center ${AD_CHIP}`}>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? m.player_unmute() : m.player_mute()}
            className="flex h-9 w-9 items-center justify-center"
          >
            <VolumeIcon muted={muted} volume={volume} />
          </button>
          <AdSlider
            label={m.player_volume()}
            value={muted ? 0 : volume}
            max={1}
            step={0.05}
            valueText={`${Math.round((muted ? 0 : volume) * 100)} %`}
            onChange={onVolume}
            className="mr-3 hidden w-16 sm:flex sm:w-20"
          />
        </div>
        <div className={`flex h-9 min-w-0 items-center gap-2 px-2 text-xs ${AD_CHIP}`}>
          <span className="hidden shrink-0 rounded-sm bg-yellow-400 px-1.5 py-0.5 font-semibold text-black sm:inline">
            {label}
          </span>
          <span
            title={m.ad_ai_note()}
            className="shrink-0 rounded-sm px-1 py-0.5 text-[10px] font-semibold text-white/80 ring-1 ring-white/40"
          >
            {m.ad_ai_badge()}
          </span>
          <span className="hidden truncate font-medium sm:inline">{brand}</span>
          {onSeek && duration > 0 ? (
            <span className="shrink-0 tabular-nums text-white/75">
              {adClock(elapsed)} / {adClock(duration)}
            </span>
          ) : (
            left > 0.5 && (
              <span className="shrink-0 tabular-nums text-white/75">{adClock(left)}</span>
            )
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {tools}
          <AdSubtitlesButton {...subtitles} className={AD_BUTTON} />
          {download && (
            <a
              href={download.href}
              download={download.name}
              aria-label={m.ad_download()}
              title={m.ad_download()}
              className={AD_BUTTON}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
          {!replay && (
            <button
              type="button"
              onClick={toggleCinemaMode}
              aria-label={
                cinemaMode ? m.player_disable_cinema_mode() : m.player_enable_cinema_mode()
              }
              className={`${AD_BUTTON} hidden lg:flex`}
            >
              <RectangleHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onFullscreen}
            aria-label={m.ad_fullscreen()}
            className={AD_BUTTON}
          >
            <Maximize className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
