import { selectPlaybackRate, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";

export function VideoJsPlaybackSpeedDefault({ speed }: { speed?: number }) {
  const slice = usePlayer(selectPlaybackRate);
  const applied = useRef(false);
  const setRate = slice?.setPlaybackRate;
  const available = slice?.playbackRateAvailability === "available";
  useEffect(() => {
    if (applied.current || !setRate || !available || !speed || speed === 1) return;
    applied.current = true;
    setRate(speed);
  }, [setRate, available, speed]);
  return null;
}
