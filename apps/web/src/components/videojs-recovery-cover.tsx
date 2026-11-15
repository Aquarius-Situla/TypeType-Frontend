import { selectError, usePlayer } from "@videojs/react";
import { LoaderCircle } from "lucide-react";
import { m } from "../paraglide/messages.js";
import { useServerStatusStore } from "../stores/server-status-store";

export function VideoJsRecoveryCover() {
  const failed = usePlayer(selectError)?.error != null;
  const away = useServerStatusStore((state) => !state.connected || state.phase !== "online");
  if (!failed || !away) return null;
  return (
    <div
      role="status"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black px-6 text-center text-sm text-white"
    >
      <LoaderCircle className="size-8 animate-spin" aria-hidden="true" />
      <p>{m.player_resuming_after_outage()}</p>
    </div>
  );
}
