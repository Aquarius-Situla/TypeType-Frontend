import { Link } from "@tanstack/react-router";
import { useTwitchFollowedChannels, useTwitchFollowedVideos } from "../hooks/use-twitch";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import { TwitchVideoCard } from "./twitch-cards";

// One page each: the rows are a way into the channels and their replays, the channel page has the full lists.
export function TwitchFollowedVideos() {
  const videos = useTwitchFollowedVideos();
  if (videos.items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold text-fg text-lg">{m.twitch_followed_videos()}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {videos.items.map((video) => (
          <div key={video.id} className="w-64 shrink-0 sm:w-72">
            <TwitchVideoCard video={video} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function TwitchFollowedChannels() {
  const channels = useTwitchFollowedChannels();
  if (channels.items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold text-fg text-lg">{m.twitch_followed_channels()}</h2>
      <ul className="flex gap-2 overflow-x-auto pb-2">
        {channels.items.map((user) => (
          <li key={user.id} className="shrink-0">
            <Link
              to="/twitch/channel/$login"
              params={{ login: user.login }}
              className="flex w-24 flex-col items-center gap-2 rounded-lg p-2 text-center hover:bg-surface-strong"
            >
              {user.avatarUrl ? (
                <img
                  src={proxyImage(user.avatarUrl, "card")}
                  alt=""
                  loading="lazy"
                  className="size-16 rounded-full object-cover"
                />
              ) : (
                <span aria-hidden="true" className="size-16 rounded-full bg-surface-strong" />
              )}
              <span className="w-full truncate text-fg text-xs">
                {user.displayName || user.login}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
