import { selectPlayback, selectVolume, usePlayer } from "@videojs/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { isAutoplayPolicyError } from "../lib/sabr-autoplay";
import { StartWithSound } from "./start-with-sound";

type Props = {
  enabled: boolean;
  // Only Twitch starts muted when the browser refuses sound; everything else stays paused until the viewer plays it.
  mutedFallback: boolean;
  policyMuted: RefObject<boolean>;
};

export function VideoJsAutoplay({ enabled, mutedFallback, policyMuted }: Props) {
  const store = usePlayer();
  const playback = usePlayer(selectPlayback);
  const volume = usePlayer(selectVolume);
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const attempted = useRef(false);
  const [refused, setRefused] = useState(0);

  useEffect(() => {
    if (!enabled || attempted.current) return;
    const start = () => {
      const player = playbackRef.current;
      if (!store.target || !player) return false;
      attempted.current = true;
      player.play().catch((error: unknown) => {
        if (isAutoplayPolicyError(error)) setRefused((count) => count + 1);
      });
      return true;
    };
    if (start()) return;
    const unsubscribe = store.subscribe(() => {
      if (start()) unsubscribe();
    });
    return unsubscribe;
  }, [enabled, store]);

  if (!mutedFallback) return null;
  return (
    <StartWithSound
      blocked={refused}
      paused={playback?.paused}
      muted={volume?.muted}
      policyMuted={policyMuted}
      play={() => playbackRef.current?.play()}
      setMuted={(next) => volume?.setMuted(next)}
    />
  );
}
