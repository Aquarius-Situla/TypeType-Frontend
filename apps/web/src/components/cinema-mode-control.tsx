import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { recordClientEvent } from "../lib/client-debug-log";
import { useMediaPlayer, useMediaState } from "../lib/vidstack";
import { m } from "../paraglide/messages.js";
import { useWatchLayoutStore } from "../stores/watch-layout-store";

function CinemaModeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="vds-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M10 10l5 2-5 2v-4z" fill="currentColor" stroke="none" />
      <path d="M7 6v12" />
      <path d="M17 6v12" />
    </svg>
  );
}

export function CinemaModeControl() {
  const { locale } = useInterfaceLocale();
  const player = useMediaPlayer();
  const pictureInPicture = useMediaState("pictureInPicture");
  const cinemaMode = useWatchLayoutStore((state) => state.cinemaMode);
  const toggleCinemaMode = useWatchLayoutStore((state) => state.toggleCinemaMode);
  const label = cinemaMode
    ? m.player_disable_cinema_mode({}, { locale })
    : m.player_enable_cinema_mode({}, { locale });

  const toggleMode = async () => {
    if (pictureInPicture) {
      if (!player) return;
      await player.exitPictureInPicture();
    }
    toggleCinemaMode();
  };

  return (
    <button
      type="button"
      onClick={() => {
        void toggleMode().catch((error: unknown) => {
          recordClientEvent("player.cinema_mode_error", {
            message: error instanceof Error ? error.message : "Unknown error",
          });
        });
      }}
      className="vds-cinema-button vds-button"
      aria-label={label}
      title={label}
      data-active={cinemaMode ? "" : null}
    >
      <CinemaModeIcon />
    </button>
  );
}
