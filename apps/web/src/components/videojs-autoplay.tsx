import { selectPlayback, usePlayer } from "@videojs/react";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isAutoplayPolicyError } from "../lib/sabr-autoplay";
import { m } from "../paraglide/messages.js";

type Props = {
  enabled: boolean;
  blocked: number;
};

// Playback always starts with sound. When the browser refuses sound before any gesture on the page, the first
// click or key press anywhere starts it, since only a user gesture lifts that rule.
export function VideoJsAutoplay({ enabled, blocked }: Props) {
  const store = usePlayer();
  const playback = usePlayer(selectPlayback);
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const attempted = useRef(false);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!enabled || attempted.current) return;
    const start = () => {
      const player = playbackRef.current;
      if (!store.target || !player) return false;
      attempted.current = true;
      player.play().catch((error: unknown) => {
        if (isAutoplayPolicyError(error)) setWaiting(true);
      });
      return true;
    };
    if (start()) return;
    const unsubscribe = store.subscribe(() => {
      if (start()) unsubscribe();
    });
    return unsubscribe;
  }, [enabled, store]);

  useEffect(() => {
    if (blocked > 0) setWaiting(true);
  }, [blocked]);

  useEffect(() => {
    if (!waiting) return;
    if (playback?.paused === false) {
      setWaiting(false);
      return;
    }
    const startOnGesture = () => {
      setWaiting(false);
      void playbackRef.current?.play().catch(() => undefined);
    };
    document.addEventListener("pointerdown", startOnGesture, { capture: true, once: true });
    document.addEventListener("keydown", startOnGesture, { capture: true, once: true });
    return () => {
      document.removeEventListener("pointerdown", startOnGesture, { capture: true });
      document.removeEventListener("keydown", startOnGesture, { capture: true });
    };
  }, [waiting, playback?.paused]);

  if (!waiting) return null;
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-3 left-3 z-30 inline-flex h-9 items-center gap-2 rounded-full bg-white px-3 text-sm font-medium text-black shadow-lg"
    >
      <Play className="size-4 fill-current" aria-hidden="true" />
      {m.player_start_with_sound_hint()}
    </div>
  );
}
