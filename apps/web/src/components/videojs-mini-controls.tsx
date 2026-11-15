import { Controls, MuteButton, SeekButton } from "@videojs/react";
import { Volume2, VolumeX } from "lucide-react";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { AudioSeekBackward10Icon, AudioSeekForward10Icon } from "./audio-control-icons";
import { ReturnToVideoButton } from "./return-to-video-button";
import {
  SKIN_HIDDEN_WHEN_IDLE,
  SkinFullscreenButton,
  SkinPlayButton,
} from "./videojs-skin-controls";

const MINI_BUTTON = `${BAR_BUTTON} size-10`;

// The row the floating mini player shows in the middle of its frame, like the Vidstack compact layout; it stays
// hidden until the frame floats (videojs-compact.css).
export function VideoJsMiniControls({ live = false }: { live?: boolean }) {
  return (
    <Controls.Content
      data-skin-mini=""
      className={`absolute inset-0 z-20 hidden items-center justify-center gap-1 bg-black/40 ${SKIN_HIDDEN_WHEN_IDLE}`}
    >
      <ReturnToVideoButton className={MINI_BUTTON} />
      {!live && (
        <SeekButton
          seconds={-10}
          className={MINI_BUTTON}
          aria-label={m.player_seek_backward_10()}
          title={m.player_seek_backward_10()}
        >
          <AudioSeekBackward10Icon size={22} />
        </SeekButton>
      )}
      <SkinPlayButton />
      {!live && (
        <SeekButton
          seconds={10}
          className={MINI_BUTTON}
          aria-label={m.player_seek_forward_10()}
          title={m.player_seek_forward_10()}
        >
          <AudioSeekForward10Icon size={22} />
        </SeekButton>
      )}
      <MuteButton
        className={MINI_BUTTON}
        render={(props, state) => (
          <button {...props} type="button">
            {state.muted || state.volumeLevel === "off" ? (
              <VolumeX className="size-5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-5" aria-hidden="true" />
            )}
          </button>
        )}
      />
      <SkinFullscreenButton />
    </Controls.Content>
  );
}
