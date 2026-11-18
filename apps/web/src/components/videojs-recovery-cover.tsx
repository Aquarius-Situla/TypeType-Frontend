import { selectError, usePlayer } from "@videojs/react";
import { m } from "../paraglide/messages.js";
import { useServerStatusStore } from "../stores/server-status-store";
import { ReactionGif } from "./reaction-gif";

export function VideoJsRecoveryCover() {
  const failed = usePlayer(selectError)?.error != null;
  const away = useServerStatusStore((state) => !state.connected || state.phase !== "online");
  if (!failed || !away) return null;
  return (
    <div
      role="status"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center text-sm text-white"
    >
      <ReactionGif kind="loading" size={96} className="loading-mascot size-24" />
      <p>{m.player_resuming_after_outage()}</p>
    </div>
  );
}
