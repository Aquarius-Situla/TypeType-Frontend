import { Link } from "@tanstack/react-router";
import { useTwitchChannel, useTwitchChannelVideos } from "../hooks/use-twitch";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import { TwitchVideoCard } from "./twitch-cards";
import { TwitchFollowButton } from "./twitch-follow-button";

const RECENT_VIDEOS = 6;

export function TwitchOfflineChannel({ login }: { login: string }) {
  const channel = useTwitchChannel(login).data;
  const videos = useTwitchChannelVideos(login).items.slice(0, RECENT_VIDEOS);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6">
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl bg-surface-strong p-6 text-center">
        {channel?.bannerUrl && (
          <img
            src={proxyImage(channel.bannerUrl, "card")}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        {channel?.avatarUrl && (
          <img
            src={proxyImage(channel.avatarUrl, "card")}
            alt=""
            className="relative size-20 rounded-full object-cover ring-4 ring-app"
          />
        )}
        <div className="relative flex flex-col gap-1">
          <p className="font-semibold text-fg text-xl">{channel?.displayName ?? login}</p>
          <p className="text-fg-muted text-sm">{m.twitch_channel_offline()}</p>
        </div>
        <div className="relative flex flex-wrap items-center justify-center gap-2">
          <TwitchFollowButton login={login} returnTo={`/twitch/watch?c=${login}`} />
          <Link
            to="/twitch/channel/$login"
            params={{ login }}
            className="rounded-lg border border-border-strong bg-app/60 px-3 py-1.5 font-medium text-fg text-sm hover:bg-surface-strong"
          >
            {m.twitch_live_ended_videos()}
          </Link>
        </div>
      </div>
      {videos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-fg">{m.twitch_recent_videos()}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {videos.map((video) => (
              <TwitchVideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
