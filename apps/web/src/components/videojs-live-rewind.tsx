import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatDuration } from "../lib/format";
import { REWIND_MIN_BEHIND_MS, rewindRangeMs, rewindTarget } from "../lib/twitch-rewind";
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

// The live edge sits at the right end; releasing the slider further back opens the past broadcast there, whose
// page has the full timeline and a way back to the live.
export function VideoJsLiveRewind() {
  const archive = useTwitchRewindStore((state) => state.archive);
  const navigate = useNavigate();
  const now = useNow(archive !== null);
  const [dragMs, setDragMs] = useState<number | null>(null);
  if (!archive) return null;
  const rangeMs = rewindRangeMs(archive.startedAt, now);
  if (rangeMs <= REWIND_MIN_BEHIND_MS) return null;
  const valueMs = dragMs ?? rangeMs;
  const behind = Math.round((rangeMs - valueMs) / 1000);
  const commit = () => {
    if (dragMs === null) return;
    const target = rewindTarget(dragMs, rangeMs);
    setDragMs(null);
    if (target !== null)
      void navigate({
        to: "/twitch/watch",
        search: { v: archive.id, t: Math.floor(target / 1000) },
      });
  };
  return (
    <div className="mx-2 flex min-w-0 flex-1 items-center gap-2">
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
      {dragMs !== null && behind > 0 && (
        <span className="shrink-0 text-white text-xs tabular-nums">-{formatDuration(behind)}</span>
      )}
    </div>
  );
}
