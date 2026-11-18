import { usePlayerMedia } from "../lib/player-media";
import { requestSabrVidstackPlayback } from "../lib/sabr-vidstack-bridge";
import { m } from "../paraglide/messages.js";

export function AudioCenterToggle({ video = null }: { video?: HTMLVideoElement | null }) {
  const { paused, play, pause } = usePlayerMedia();
  const label = paused ? m.ui_play_audio() : m.ui_pause_audio();

  const togglePlayback = async () => {
    if (video) return requestSabrVidstackPlayback(video, paused, true);
    if (paused) play();
    else pause();
  };

  return (
    <button
      type="button"
      className="typetype-audio-center-toggle"
      aria-label={label}
      onClickCapture={(event) => {
        event.stopPropagation();
        void togglePlayback().catch(() => {});
      }}
    />
  );
}
