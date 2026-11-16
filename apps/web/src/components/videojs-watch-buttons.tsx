import { CaptionsButton, selectPiP, usePlayer } from "@videojs/react";
import {
  Captions,
  CaptionsOff,
  Expand,
  RectangleHorizontal,
  Shrink,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { useWatchLayoutStore } from "../stores/watch-layout-store";

const ICON = "size-5";

export function SkinTrackButton({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick?: () => void;
}) {
  if (!onClick) return null;
  const label = direction === "previous" ? m.player_previous_video() : m.player_next_video();
  const Icon = direction === "previous" ? SkipBack : SkipForward;
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={BAR_BUTTON}>
      <Icon className={`${ICON} fill-current`} aria-hidden="true" />
    </button>
  );
}

// Cinema mode and web fullscreen are page layouts: leaving picture in picture first keeps the video on the page.
function useLayoutToggle(toggle: () => void) {
  const pip = usePlayer(selectPiP);
  return () => {
    if (pip?.isPictureInPicture) void pip.exitPictureInPicture().catch(() => {});
    toggle();
  };
}

export function SkinCinemaButton() {
  const cinemaMode = useWatchLayoutStore((state) => state.cinemaMode);
  const onClick = useLayoutToggle(useWatchLayoutStore((state) => state.toggleCinemaMode));
  const label = cinemaMode ? m.player_disable_cinema_mode() : m.player_enable_cinema_mode();
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={cinemaMode}
      title={label}
      onClick={onClick}
      className={BAR_BUTTON}
    >
      <RectangleHorizontal
        className={`${ICON} ${cinemaMode ? "fill-current" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}

export function SkinWebFullscreenButton() {
  const webFullscreen = useWatchLayoutStore((state) => state.webFullscreen);
  const onClick = useLayoutToggle(useWatchLayoutStore((state) => state.toggleWebFullscreen));
  const label = webFullscreen
    ? m.player_disable_web_fullscreen()
    : m.player_enable_web_fullscreen();
  const Icon = webFullscreen ? Shrink : Expand;
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={webFullscreen}
      title={label}
      onClick={onClick}
      className={BAR_BUTTON}
    >
      <Icon className={ICON} aria-hidden="true" />
    </button>
  );
}

export function SkinCaptionsButton() {
  return (
    <CaptionsButton
      className={BAR_BUTTON}
      render={(props, state) => (
        <button
          {...props}
          type="button"
          title={
            state.subtitlesShowing ? m.player_closed_captions_off() : m.player_closed_captions_on()
          }
        >
          {state.subtitlesShowing ? (
            <Captions className={ICON} aria-hidden="true" />
          ) : (
            <CaptionsOff className={ICON} aria-hidden="true" />
          )}
        </button>
      )}
    />
  );
}
