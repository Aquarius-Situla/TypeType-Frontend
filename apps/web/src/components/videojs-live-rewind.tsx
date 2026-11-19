import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDuration } from "../lib/format";
import {
  REWIND_MIN_BEHIND_MS,
  rewindRangeMs,
  rewindSliderValue,
  rewindTarget,
} from "../lib/twitch-rewind";
import { m } from "../paraglide/messages.js";
import { useTwitchRewindStore } from "../stores/twitch-rewind-store";

const STEP_MS = 10_000;

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, [active]);
  return now;
}

export function useReturnToLive(): () => void {
  const login = useTwitchRewindStore((state) => state.login);
  const navigate = useNavigate();
  return () => {
    if (login) void navigate({ to: "/twitch/watch", search: { c: login }, replace: true });
  };
}

// The whole broadcast on one slider, the live edge at its right end. A narrow player gives it its own row above the
// buttons, as a VOD progress bar has, instead of the space left between them. Going back keeps the live page and its chat and
// plays the recording; coming close to the edge again returns to the live.
export function VideoJsLiveRewind() {
  const archive = useTwitchRewindStore((state) => state.archive);
  const login = useTwitchRewindStore((state) => state.login);
  const rewinding = useTwitchRewindStore((state) => state.rewinding);
  const positionMs = useTwitchRewindStore((state) => state.positionMs);
  const seek = useTwitchRewindStore((state) => state.seek);
  const navigate = useNavigate();
  const returnToLive = useReturnToLive();
  const now = useNow(archive !== null);
  const [dragMs, setDragMs] = useState<number | null>(null);
  if (!archive || !login) return null;
  const rangeMs = rewindRangeMs(archive.startedAt, now);
  if (rangeMs <= REWIND_MIN_BEHIND_MS) return null;
  const valueMs = rewindSliderValue(dragMs, rewinding, positionMs, rangeMs);
  const behind = Math.max(0, Math.round((rangeMs - valueMs) / 1000));
  const commit = () => {
    if (dragMs === null) return;
    const target = rewindTarget(dragMs, rangeMs);
    setDragMs(null);
    if (target === null) {
      if (rewinding) returnToLive();
    } else if (rewinding) {
      seek?.(target / 1000);
    } else {
      void navigate({
        to: "/twitch/watch",
        search: { c: login, t: Math.floor(target / 1000) },
      });
    }
  };
  return (
    <div className="mx-2 flex min-w-0 flex-1 items-center gap-2 @max-2xl:order-first @max-2xl:mx-1 @max-2xl:basis-full">
      <input
        type="range"
        min={0}
        max={rangeMs}
        step={STEP_MS}
        value={valueMs}
        aria-label={m.twitch_rewind()}
        aria-valuetext={
          behind > 0 ? m.twitch_rewind_behind({ time: formatDuration(behind) }) : m.ui_live()
        }
        onChange={(event) => setDragMs(Number(event.currentTarget.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="h-1 w-full min-w-0 cursor-pointer accent-[#9146ff]"
      />
      {(dragMs !== null || rewinding) && behind > 0 && (
        <span className="shrink-0 text-white text-xs tabular-nums">-{formatDuration(behind)}</span>
      )}
    </div>
  );
}
