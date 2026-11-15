import { selectPlayback, usePlayer } from "@videojs/react";
import { useEffect, useRef, useState } from "react";
import { isAutoplayPolicyError } from "../lib/sabr-autoplay";
import { StartWithSound } from "./start-with-sound";

type Props = {
  enabled: boolean;
  blocked: number;
};

export function VideoJsAutoplay({ enabled, blocked }: Props) {
  const store = usePlayer();
  const playback = usePlayer(selectPlayback);
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

  return (
    <StartWithSound
      blocked={blocked + refused}
      paused={playback?.paused}
      play={() => playbackRef.current?.play()}
    />
  );
}
