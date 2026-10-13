import { usePlayerGestures } from "../hooks/use-player-gestures";
import { usePlayerKeyboard } from "../hooks/use-player-keyboard";
import { PlayerFastForwardIndicator } from "./player-fast-forward-indicator";

export function PlayerHotkeys({
  canSeek,
  sabrVideo,
  compact = false,
}: {
  canSeek: boolean;
  sabrVideo: HTMLVideoElement | null;
  compact?: boolean;
}) {
  const touchHolding = usePlayerGestures(canSeek, !compact);
  const keyboardHolding = usePlayerKeyboard(canSeek, sabrVideo, compact);
  return touchHolding || keyboardHolding ? <PlayerFastForwardIndicator /> : null;
}
