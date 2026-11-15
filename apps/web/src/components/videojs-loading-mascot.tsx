import { selectPlayback, usePlayer } from "@videojs/react";
import { useEffect, useState } from "react";
import { ReactionGif } from "./reaction-gif";

// A short wait hides the mascot for stalls the eye would not notice anyway.
const STALL_DELAY_MS = 400;
const NEXT_MASCOT_MS = 4000;

// Until the first frame plays, the mascot covers the poster, like the loading screens of the rest of the app; later
// stalls show it over the last frame. SABR starts playback itself, so the player reads as paused until that first
// frame: an intended autoplay counts as starting. A long wait takes turns through the loading reactions.
export function VideoJsLoadingMascot({ autoplay = false }: { autoplay?: boolean }) {
  const playback = usePlayer(selectPlayback);
  const starting = Boolean(
    playback && !playback.started && (autoplay || playback.autoplaying || !playback.paused),
  );
  const stalled = Boolean(playback?.started && playback.waiting && !playback.paused);
  const [late, setLate] = useState(false);
  const [turn, setTurn] = useState(0);
  const visible = starting || late;

  useEffect(() => {
    if (!stalled) {
      setLate(false);
      return;
    }
    const timer = window.setTimeout(() => setLate(true), STALL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [stalled]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => setTurn((value) => value + 1), NEXT_MASCOT_MS);
    return () => window.clearInterval(timer);
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 grid place-content-center ${starting ? "bg-black" : ""}`}
    >
      <ReactionGif key={turn} kind="loading" size={96} className="loading-mascot size-24" />
    </div>
  );
}
