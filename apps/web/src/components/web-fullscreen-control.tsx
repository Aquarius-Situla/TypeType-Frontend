import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { recordClientEvent } from "../lib/client-debug-log";
import { useMediaPlayer, useMediaState } from "../lib/vidstack";
import { m } from "../paraglide/messages.js";
import { useWatchLayoutStore } from "../stores/watch-layout-store";

function WebFullscreenIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="vds-icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" strokeWidth="1.5" />
        <rect x="6.5" y="12" width="11" height="4" rx="0.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="vds-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18" strokeWidth="1.5" />
      <rect x="6.5" y="12" width="11" height="4" rx="0.5" strokeWidth="1.5" />
    </svg>
  );
}

export function WebFullscreenControl() {
  const { locale } = useInterfaceLocale();
  const player = useMediaPlayer();
  const pictureInPicture = useMediaState("pictureInPicture");
  const webFullscreen = useWatchLayoutStore((state) => state.webFullscreen);
  const toggleWebFullscreen = useWatchLayoutStore((state) => state.toggleWebFullscreen);

  const isZh = locale?.startsWith("zh");
  const label = webFullscreen
    ? (isZh ? "退出网页全屏" : m.player_disable_web_fullscreen({}, { locale }))
    : (isZh ? "网页全屏" : m.player_enable_web_fullscreen({}, { locale }));

  const toggleMode = async () => {
    if (pictureInPicture) {
      if (!player) return;
      await player.exitPictureInPicture();
    }
    toggleWebFullscreen();
  };

  return (
    <button
      type="button"
      onClick={() => {
        void toggleMode().catch((error: unknown) => {
          recordClientEvent("player.web_fullscreen_error", {
            message: error instanceof Error ? error.message : null,
          });
        });
      }}
      className="vds-web-fullscreen-button vds-button"
      aria-label={label}
      title={label}
      data-active={webFullscreen ? "" : null}
    >
      <WebFullscreenIcon active={webFullscreen} />
    </button>
  );
}
