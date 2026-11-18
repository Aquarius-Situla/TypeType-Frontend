import { selectTime, usePlayer } from "@videojs/react";
import { TwitchVodChat } from "./twitch-vod-chat";

// The replayed chat over the fullscreen video follows the player clock directly, whole seconds only.
export function TwitchVodChatOverlay({ videoId, login }: { videoId: string; login: string }) {
  const seconds = Math.floor(usePlayer(selectTime)?.currentTime ?? 0);
  return <TwitchVodChat videoId={videoId} login={login} seconds={seconds} overlay />;
}
