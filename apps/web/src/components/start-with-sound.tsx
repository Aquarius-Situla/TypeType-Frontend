import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  blocked: number;
  paused: boolean | undefined;
  play: () => Promise<unknown> | undefined;
};

// Playback always starts with sound. When the browser refuses sound before any gesture on the page, the first
// click or key press anywhere starts it, since only a user gesture lifts that rule.
export function StartWithSound({ blocked, paused, play }: Props) {
  const [waiting, setWaiting] = useState(false);
  const playRef = useRef(play);
  playRef.current = play;

  useEffect(() => {
    if (blocked > 0) setWaiting(true);
  }, [blocked]);

  useEffect(() => {
    if (!waiting) return;
    if (paused === false) {
      setWaiting(false);
      return;
    }
    const startOnGesture = () => {
      setWaiting(false);
      void playRef.current()?.catch(() => undefined);
    };
    document.addEventListener("pointerdown", startOnGesture, { capture: true, once: true });
    document.addEventListener("keydown", startOnGesture, { capture: true, once: true });
    return () => {
      document.removeEventListener("pointerdown", startOnGesture, { capture: true });
      document.removeEventListener("keydown", startOnGesture, { capture: true });
    };
  }, [waiting, paused]);

  if (!waiting) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-3 left-3 z-30 inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 font-medium text-black text-sm shadow-lg"
    >
      <Play className="size-4 fill-current" aria-hidden="true" />
      {m.player_start_with_sound_hint()}
    </div>
  );
}
