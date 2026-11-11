import { useEffect, useRef, useState } from "react";
import type { Ad } from "../lib/ad-catalog";
import type { AdProgress } from "../lib/ad-progress";
import { useMediaRemote, useMediaState } from "../lib/vidstack";
import { AdClassic } from "./ad-classic";
import { AdTrial } from "./ad-trial";

type Props = { ad: Ad; progress: AdProgress; resume: boolean; onFinish: () => void };

// The ad that plays over the player before a video. It holds the video paused until the ad is
// over, then starts it if the page would have autoplayed.
export function AdBreakOverlay({ ad, progress, resume, onFinish }: Props) {
  const remote = useMediaRemote();
  const paused = useMediaState("paused");
  const volume = useMediaState("volume");
  const playerMuted = useMediaState("muted");
  const [muted, setMuted] = useState(playerMuted);
  const [soundBlocked, setSoundBlocked] = useState(false);

  // When the browser only allowed a muted start, the first gesture turns the sound back on.
  useEffect(() => {
    if (!soundBlocked) return;
    const unmute = () => {
      setSoundBlocked(false);
      setMuted(false);
    };
    window.addEventListener("pointerdown", unmute, { capture: true, once: true });
    window.addEventListener("keydown", unmute, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", unmute, { capture: true });
      window.removeEventListener("keydown", unmute, { capture: true });
    };
  }, [soundBlocked]);
  const finished = useRef(false);

  useEffect(() => {
    if (!paused && !finished.current) remote.pause();
  }, [paused, remote]);

  useEffect(
    () => () => {
      if (finished.current && resume) remote.play();
    },
    [remote, resume],
  );

  function finish() {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  }

  const shared = {
    brand: ad.brand(),
    progress,
    volume,
    muted,
    onToggleMute: () => setMuted((before) => !before),
    // The ad shares its volume with the player, so the video starts at the level the viewer set.
    onVolume: (level: number) => remote.changeVolume(level),
    soundBlocked,
    onSoundBlocked: () => {
      setMuted(true);
      setSoundBlocked(true);
    },
    onFinish: finish,
  };
  return ad.kind === "trial" ? (
    <AdTrial {...shared} />
  ) : (
    <AdClassic {...shared} src={ad.src} cues={ad.cues} />
  );
}
