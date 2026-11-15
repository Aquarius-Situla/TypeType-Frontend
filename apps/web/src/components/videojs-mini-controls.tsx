import { Controls, SeekButton } from "@videojs/react";
import { useReturnToVideo } from "../hooks/use-return-to-video";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { AudioSeekBackward10Icon, AudioSeekForward10Icon } from "./audio-control-icons";
import { SkinPlayButton } from "./videojs-skin-controls";

const SEEK = `${BAR_BUTTON} pointer-events-auto size-11`;
const PLAY = `${BAR_BUTTON} pointer-events-auto size-14 [&_svg]:size-7`;

// The floating mini player keeps the bottom bar for the progress, sound and fullscreen, and moves play and the
// 10 second seeks to the middle of its small frame; a click anywhere else on the frame goes back to the video page,
// like the YouTube mini player (videojs-compact.css).
export function VideoJsMiniControls({ live = false }: { live?: boolean }) {
  const back = useReturnToVideo();
  return (
    <Controls.Content
      data-skin-mini=""
      title={back ? m.player_return_to_video() : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) back?.();
      }}
      className="absolute inset-0 z-10 hidden cursor-pointer items-center justify-center gap-3 bg-black/25 transition-opacity duration-200 ease-out motion-reduce:transition-none [&:not([data-visible])]:opacity-0 [&:not([data-visible])_button]:pointer-events-none"
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
