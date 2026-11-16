import type { RefObject } from "react";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";
import { StartWithSound } from "./start-with-sound";

type Props = { blocked: number; policyMuted: RefObject<boolean> };

export function VidstackStartWithSound({ blocked, policyMuted }: Props) {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const paused = useMediaState("paused");
  const muted = useMediaState("muted");
  return (
    <StartWithSound
      blocked={blocked}
      paused={paused}
      muted={muted}
      policyMuted={policyMuted}
      play={() => player?.play()}
      setMuted={(next) => (next ? remote.mute() : remote.unmute())}
    />
  );
}
