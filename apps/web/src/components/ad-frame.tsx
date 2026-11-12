import { Play, VolumeX } from "lucide-react";
import { type ReactNode, type SyntheticEvent, useRef } from "react";
import { useAdGuard } from "../hooks/use-ad-guard";
import { useAdIdle } from "../hooks/use-ad-idle";
import { clampVolume } from "../lib/ad-player";
import { m } from "../paraglide/messages.js";
import { AdControls } from "./ad-controls";
import { AdSkip } from "./ad-skip";
import { AdCaption, useAdSubtitles } from "./ad-subtitles";
import "../styles/ad-motion.css";

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
  // Fullscreen goes to the whole player so the ad keeps its place when the video takes over.
  function toggleFullscreen() {
    if (document.fullscreenElement) return void document.exitFullscreen();
    const target = frame.current?.closest("[data-media-player]") ?? frame.current?.parentElement;
    void target?.requestFullscreen().catch(() => undefined);
  }

  const { shown, wake } = useAdIdle(paused || blocked || covered);

  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

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
      <AdControls
        shown={shown}
        label={label}
        brand={brand}
        elapsed={elapsed}
        duration={duration}
        paused={paused}
        muted={muted}
        volume={volume}
        subtitles={subtitles}
        onTogglePause={onTogglePause}
        onToggleMute={onToggleMute}
        onVolume={changeVolume}
        onSeek={onSeek}
        onFullscreen={toggleFullscreen}
        replay={replay}
        download={download}
        tools={tools}
      />
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
