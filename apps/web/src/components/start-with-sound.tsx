import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  blocked: number;
  paused: boolean | undefined;
  play: () => Promise<unknown> | undefined;
};

// Playback always starts with sound. When the browser refuses sound before any gesture on the page, a play button
// covers the video and the first click or key press anywhere starts playback, since only a user gesture lifts
// that rule. The button sits above the player's own click layer: a click reaching that layer would toggle
// playback a second time and pause it again.
export function StartWithSound({ blocked, paused, play }: Props) {
  const [waiting, setWaiting] = useState(false);
  const cover = useRef<HTMLButtonElement>(null);
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
    const video = cover.current?.closest("[data-player-root]")?.querySelector("video");
    const startAfterGesture = (event: Event) => {
      if (event.target instanceof Node && cover.current?.contains(event.target)) return;
      window.setTimeout(() => {
        setWaiting(false);
        if (!video || video.paused) void playRef.current()?.catch(() => undefined);
      }, 0);
    };
    document.addEventListener("click", startAfterGesture, { capture: true });
    document.addEventListener("keyup", startAfterGesture, { capture: true });
    return () => {
      document.removeEventListener("click", startAfterGesture, { capture: true });
      document.removeEventListener("keyup", startAfterGesture, { capture: true });
    };
  }, [waiting, paused]);

  if (!waiting) return null;
  return (
    <button
      ref={cover}
      type="button"
      aria-label={m.player_start_with_sound_hint()}
      onClick={(event) => {
        event.stopPropagation();
        setWaiting(false);
        void playRef.current()?.catch(() => undefined);
      }}
      className="group absolute inset-0 z-30 flex cursor-pointer items-center justify-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors group-hover:bg-black/75">
        <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
      </span>
    </button>
  );
}
