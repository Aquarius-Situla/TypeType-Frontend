import { useEffect, useRef } from "react";
import { isIosDevice } from "../lib/ios-device";
import { useMediaPlayer, useMediaRemote, useMediaState } from "../lib/vidstack";

export function SeekBridge({
  onSeekReady,
}: {
  onSeekReady: (seek: (seconds: number) => void) => void;
}) {
  const remote = useMediaRemote();
  const onSeekReadyRef = useRef(onSeekReady);
  onSeekReadyRef.current = onSeekReady;
  useEffect(() => {
    onSeekReadyRef.current((seconds: number) => remote.seek(seconds));
  }, [remote]);
  return null;
}

export function PlayerFocuser() {
  const ios = isIosDevice();
  const player = useMediaPlayer();
  const canPlay = useMediaState("canPlay");
  const focused = useRef(false);
  useEffect(() => {
    if (ios) return;
    if (!canPlay || focused.current || !player?.el) return;
    focused.current = true;
    player.el.focus({ preventScroll: true });
  }, [ios, canPlay, player]);
  return null;
}
