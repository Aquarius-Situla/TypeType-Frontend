import { Controls, SeekButton } from "@videojs/react";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { AudioSeekBackward10Icon, AudioSeekForward10Icon } from "./audio-control-icons";
import { SKIN_HIDDEN_WHEN_IDLE, SkinPlayButton } from "./videojs-skin-controls";

const SEEK = `${BAR_BUTTON} pointer-events-auto size-11`;
const PLAY = `${BAR_BUTTON} pointer-events-auto size-14 [&_svg]:size-7`;

// The floating mini player keeps the bottom bar for the progress, sound and fullscreen, and moves play and the
// 10 second seeks to the middle of its small frame, like the YouTube mini player (videojs-compact.css).
export function VideoJsMiniControls({ live = false }: { live?: boolean }) {
  return (
    <Controls.Content
      data-skin-mini=""
      className={`pointer-events-none absolute inset-0 z-10 hidden items-center justify-center gap-3 bg-black/25 [&:not([data-visible])_button]:pointer-events-none ${SKIN_HIDDEN_WHEN_IDLE}`}
    >
      {!live && (
        <SeekButton
          seconds={-10}
          className={SEEK}
          aria-label={m.player_seek_backward_10()}
          title={m.player_seek_backward_10()}
        >
          <AudioSeekBackward10Icon size={24} />
        </SeekButton>
      )}
      <SkinPlayButton className={PLAY} />
      {!live && (
        <SeekButton
          seconds={10}
          className={SEEK}
          aria-label={m.player_seek_forward_10()}
          title={m.player_seek_forward_10()}
        >
          <AudioSeekForward10Icon size={24} />
        </SeekButton>
      )}
    </Controls.Content>
  );
}
