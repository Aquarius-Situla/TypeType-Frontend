import {
  Captions,
  CaptionsOff,
  FastForward,
  Gauge,
  type LucideIcon,
  Pause,
  Play,
  Rewind,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { recentPlayerKey, usePlayerKeySignal } from "../lib/player-key-signal";
import { m } from "../paraglide/messages.js";
import { usePlayerAccessibilityStore } from "../stores/player-accessibility-store";

const KEY_WINDOW_MS = 700;
const SHOW_MS = 650;
const VOLUME_KEYS = new Set(["m", "M", "ArrowUp", "ArrowDown"]);
const PLAY_KEYS = new Set(["k", "K", " "]);

type Shown = { id: number; icon: LucideIcon; text: string };

// The keyboard animations of the Vidstack layout: a short badge with the new volume, speed, position or state, shown
// only when a shortcut caused the change, never for a click. Screen readers get the status announcer instead.
export function VideoJsKeyboardFeedback({ video }: { video: HTMLVideoElement | null }) {
  const signal = usePlayerKeySignal();
  const enabled = usePlayerAccessibilityStore((state) => state.keyboardAnimations);
  const [shown, setShown] = useState<Shown | null>(null);

  useEffect(() => {
    if (!enabled || !video) return;
    let id = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (icon: LucideIcon, text = "") => {
      id += 1;
      setShown({ id, icon, text });
      clearTimeout(timer);
      timer = setTimeout(() => setShown(null), SHOW_MS);
    };
    const key = () => recentPlayerKey(signal, KEY_WINDOW_MS);
    const onVolume = () => {
      const pressed = key();
      if (!pressed || !VOLUME_KEYS.has(pressed)) return;
      const silent = video.muted || video.volume === 0;
      if (silent) show(VolumeX);
      else show(video.volume < 0.5 ? Volume1 : Volume2, `${Math.round(video.volume * 100)} %`);
    };
    const onRate = () => {
      const pressed = key();
      if (pressed === "<" || pressed === ">") show(Gauge, `${video.playbackRate}x`);
    };
    const onPlayback = () => {
      const pressed = key();
      if (pressed && PLAY_KEYS.has(pressed)) show(video.paused ? Pause : Play);
    };
    const seekBadge = (seconds: number) =>
      show(
        seconds < 0 ? Rewind : FastForward,
        m.player_feedback_seek({ value: seconds > 0 ? `+${seconds}` : `${seconds}` }),
      );
    const tracks = video.textTracks;
    const captionsBadge = () => {
      const on = Array.from(tracks).some(
        (track) =>
          track.mode === "showing" && (track.kind === "subtitles" || track.kind === "captions"),
      );
      show(
        on ? Captions : CaptionsOff,
        on ? m.player_closed_captions_on() : m.player_closed_captions_off(),
      );
    };
    let pending: ReturnType<typeof setTimeout> | undefined;
    if (signal) {
      signal.current.onSeek = seekBadge;
      signal.current.onKey = (pressed) => {
        if (/^[0-9]$/.test(pressed) && Number.isFinite(video.duration))
          show(SkipForward, `${Number(pressed) * 10} %`);
        if (pressed === "c" || pressed === "C") {
          clearTimeout(pending);
          pending = setTimeout(captionsBadge, 80);
        }
      };
    }
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("ratechange", onRate);
    video.addEventListener("play", onPlayback);
    video.addEventListener("pause", onPlayback);
    return () => {
      clearTimeout(timer);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("ratechange", onRate);
      video.removeEventListener("play", onPlayback);
      video.removeEventListener("pause", onPlayback);
      clearTimeout(pending);
      if (signal) {
        signal.current.onKey = undefined;
        signal.current.onSeek = undefined;
      }
    };
  }, [enabled, video, signal]);

  if (!shown) return null;
  const Icon = shown.icon;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
    >
      <div
        key={shown.id}
        className="typetype-key-feedback flex items-center gap-2 rounded-full bg-black/65 px-4 py-2.5 font-medium text-sm text-white tabular-nums"
      >
        <Icon className="size-6 fill-current" aria-hidden="true" />
        {shown.text && <span>{shown.text}</span>}
      </div>
    </div>
  );
}
