import { useMediaPlayer, useMediaState } from "../lib/vidstack";
import { StartWithSound } from "./start-with-sound";

export function VidstackStartWithSound({ blocked }: { blocked: number }) {
  const player = useMediaPlayer();
  const paused = useMediaState("paused");
  return <StartWithSound blocked={blocked} paused={paused} play={() => player?.play()} />;
}
