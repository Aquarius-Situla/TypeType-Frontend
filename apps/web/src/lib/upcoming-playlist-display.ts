import { m } from "../paraglide/messages.js";
import type { WatchPlaylistItem } from "../types/playlist";

export type UpcomingDisplay = {
  title: string;
  thumbnail: string;
  channelName: string;
  hidden: boolean;
};

export function upcomingPlaylistDisplay(
  video: WatchPlaylistItem | null | undefined,
  hidden: boolean,
): UpcomingDisplay {
  if (hidden) return { title: "", thumbnail: "", channelName: "", hidden: true };
  return {
    title: video?.title ?? m.player_next_video_fallback(),
    thumbnail: video?.thumbnail ?? "",
    channelName: video?.channelName ?? "",
    hidden: false,
  };
}
