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
import { type ReactNode, type SyntheticEvent, useEffect, useRef, useState } from "react";
import { useAdGuard } from "../hooks/use-ad-guard";
import { AD_CHIP, clampVolume } from "../lib/ad-player";
import { m } from "../paraglide/messages.js";
import { useWatchLayoutStore } from "../stores/watch-layout-store";
import { AdSkip } from "./ad-skip";
import { AdSlider } from "./ad-slider";
import { AdCaption, AdSubtitlesButton, useAdSubtitles } from "./ad-subtitles";

// The controls fade out after this long without the pointer moving, as in the player.
const IDLE_MS = 2500;

type Props = {
  label: string;
  brand: string;
  // Key of the playing clip in the subtitle files.
  clip: string;
  elapsed: number;
  duration: number;
  // The browser refused to start the video: show a play button.
  blocked: boolean;
  muted: boolean;
  volume: number;
  // The browser only let the video start muted: offer to turn the sound on.
  soundBlocked: boolean;
  paused: boolean;
  children: ReactNode;
  onStart: () => void;
  // Absent while there is nothing to pause: a choice of the trial already waits, an ending is over.
  onTogglePause?: () => void;
  onToggleMute: () => void;
  onVolume: (volume: number) => void;
  // Present when the viewer may move through the clip: the progress line becomes a seek bar.
  onSeek?: (seconds: number) => void;
  // The ad is replayed from the sponsors page: no skip button to chase.
  replay?: boolean;
  download?: { href: string; name: string };
  // Extra buttons of the trial, laid at the start of the right-hand group.
  tools?: ReactNode;
  // A screen of the trial covers the picture: the controls stay on.
  covered?: boolean;
};

// The player underneath toggles playback on pointer down.
function stopPlayerEvent(event: SyntheticEvent) {
  event.stopPropagation();
}

function adClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export const AD_BUTTON = `flex h-9 w-9 shrink-0 items-center justify-center transition hover:bg-black/80 ${AD_CHIP}`;

function VolumeIcon({ muted, volume }: { muted: boolean; volume: number }) {
  if (muted || volume === 0) return <VolumeX className="h-4 w-4" aria-hidden="true" />;
  if (volume < 0.5) return <Volume1 className="h-4 w-4" aria-hidden="true" />;
  return <Volume2 className="h-4 w-4" aria-hidden="true" />;
}

// The shell shared by every ad: it covers the player, locks it, and carries the controls an ad
// allows (pause, sound, subtitles, fullscreen, cinema mode, and seeking where it is allowed) plus
// the skip button.
export function AdFrame({
  label,
  brand,
  clip,
  elapsed,
  duration,
  blocked,
  muted,
  volume,
  soundBlocked,
  paused,
  children,
  onStart,
  onTogglePause,
  onToggleMute,
  onVolume,
  onSeek,
  replay = false,
  download,
  tools,
  covered = false,
}: Props) {
  const frame = useRef<HTMLElement | null>(null);
  const subtitles = useAdSubtitles(clip, elapsed);
  const [idle, setIdle] = useState(false);
  const idleTimer = useRef(0);

  // Keys can repeat faster than the player reports the new level: steps add up from here.
  const level = useRef({ volume, elapsed });
  level.current = { volume, elapsed };

  function changeVolume(next: number) {
    const volumeLevel = clampVolume(next);
    level.current.volume = volumeLevel;
    onVolume(volumeLevel);
    if (muted && volumeLevel > 0) onToggleMute();
  }

  useAdGuard(frame, {
    togglePause: onTogglePause,
    seekBy:
      onSeek &&
      ((seconds) => {
        level.current.elapsed = Math.max(0, level.current.elapsed + seconds);
        onSeek(level.current.elapsed);
      }),
    volumeBy: (step) => changeVolume((muted ? 0 : level.current.volume) + step),
    toggleMute: onToggleMute,
  });
  const cinemaMode = useWatchLayoutStore((state) => state.cinemaMode);
  const toggleCinemaMode = useWatchLayoutStore((state) => state.toggleCinemaMode);
  // Fullscreen goes to the whole player so the ad keeps its place when the video takes over.
  function toggleFullscreen() {
    if (document.fullscreenElement) return void document.exitFullscreen();
    const target = frame.current?.closest("[data-media-player]") ?? frame.current?.parentElement;
    void target?.requestFullscreen().catch(() => undefined);
  }

  const resting = paused || blocked || covered;
  function wake() {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: the timer restarts whenever the ad starts or stops
  useEffect(() => {
    wake();
    return () => window.clearTimeout(idleTimer.current);
  }, [resting]);
  const shown = resting || !idle;

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;
  const left = duration - elapsed;

  return (
    <section
      ref={frame}
      tabIndex={-1}
      aria-label={label}
      className={`absolute inset-0 z-[60] overflow-hidden bg-black text-white outline-none ${shown ? "" : "cursor-none"}`}
      onPointerDown={stopPlayerEvent}
      onPointerMove={(event) => {
        // Touch screens send a move with every tap: only a mouse wakes the controls by moving.
        if (event.pointerType === "mouse") wake();
      }}
      onKeyDown={wake}
      // A press on the picture pauses the ad, as Space and K do through the guard. On a touch
      // screen the first tap only brings the hidden controls back.
      onPointerUp={(event) => {
        if (!(event.target instanceof HTMLVideoElement)) return;
        if (event.pointerType === "touch" && !shown) return wake();
        onTogglePause?.();
      }}
    >
      {children}
      {(blocked || paused) && (
        <button
          type="button"
          onClick={blocked ? onStart : onTogglePause}
          aria-label={m.player_play()}
          className="absolute inset-0 z-20 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/30 transition hover:bg-black/75"
        >
          <Play className="h-8 w-8" aria-hidden="true" />
        </button>
      )}
      <AdCaption line={subtitles.line} raised={shown} />
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
              onChange={changeVolume}
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
              onClick={toggleFullscreen}
              aria-label={m.ad_fullscreen()}
              className={AD_BUTTON}
            >
              <Maximize className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {soundBlocked && (
        <button
          type="button"
          onClick={onToggleMute}
          className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg"
        >
          <VolumeX className="h-4 w-4" aria-hidden="true" />
          {m.ad_sound_on()}
        </button>
      )}
      {/* Nothing to skip while a choice, an ending or the chapter list is up. */}
      {!replay && !covered && <AdSkip elapsed={elapsed} />}
      {!onSeek && !shown && (
        <div className="absolute inset-x-0 bottom-0 z-30 h-1 bg-white/20">
          <div className="h-full bg-yellow-400" style={{ width: `${progress}%` }} />
        </div>
      )}
    </section>
  );
}
