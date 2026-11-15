import { selectPlayback, selectVolume, usePlayer } from "@videojs/react";
import { VolumeX } from "lucide-react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { isAutoplayPolicyError } from "../lib/sabr-autoplay";
import { m } from "../paraglide/messages.js";

type Props = {
  enabled: boolean;
  policyMuted: RefObject<boolean>;
};

export function VideoJsAutoplay({ enabled, policyMuted }: Props) {
  const store = usePlayer();
  const volume = usePlayer(selectVolume);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const playback = usePlayer(selectPlayback);
  const playbackRef = useRef(playback);
  playbackRef.current = playback;
  const attempted = useRef(false);
  const [silenced, setSilenced] = useState(false);

  useEffect(() => {
    if (!enabled || attempted.current) return;
    const start = () => {
      const slice = volumeRef.current;
      const player = playbackRef.current;
      if (!store.target || !slice || !player) return false;
      attempted.current = true;
      player.play().catch((error: unknown) => {
        if (!isAutoplayPolicyError(error) || slice.muted) return;
        policyMuted.current = true;
        slice.setMuted(true);
        setSilenced(true);
        player.play().catch(() => {
          policyMuted.current = false;
          slice.setMuted(false);
          setSilenced(false);
        });
      });
      return true;
    };
    if (start()) return;
    const unsubscribe = store.subscribe(() => {
      if (start()) unsubscribe();
    });
    return unsubscribe;
  }, [enabled, store, policyMuted]);

  useEffect(() => {
    if (!silenced || volume?.muted !== false) return;
    policyMuted.current = false;
    setSilenced(false);
  }, [silenced, volume?.muted, policyMuted]);

  if (!silenced) return null;
  return (
    <button
      type="button"
      onClick={() => volumeRef.current?.setMuted(false)}
      className="absolute top-3 left-3 z-30 inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-white px-3 text-sm font-medium text-black shadow-lg hover:bg-white/90"
    >
      <VolumeX className="size-4" aria-hidden="true" />
      {m.player_unmute_hint()}
    </button>
  );
}
