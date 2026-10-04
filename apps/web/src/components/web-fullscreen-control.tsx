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
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 8h20" />
        <path d="M9 13l-2 2" />
        <path d="M7 13h2v2" />
        <path d="M15 17l2-2" />
        <path d="M17 17h-2v-2" />
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
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M2 8h20" />
      <rect x="5" y="11" width="14" height="7" rx="1" />
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
