import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TwitchClipCard, TwitchVideoCard } from "../components/twitch-cards";
import { TwitchFollowButton } from "../components/twitch-follow-button";
import { TwitchDisabled, TwitchGrid } from "../components/twitch-grid";
import {
  useTwitchChannel,
  useTwitchChannelClips,
  useTwitchChannelVideos,
  useTwitchEnabled,
} from "../hooks/use-twitch";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";

type Tab = "videos" | "clips";

function ChannelVideos({ login }: { login: string }) {
  const videos = useTwitchChannelVideos(login);
  return (
    <TwitchGrid
      {...videos}
      hasNextPage={videos.hasNextPage}
      itemKey={(v) => v.id}
      render={(v) => <TwitchVideoCard video={v} />}
      empty={m.twitch_no_videos()}
      idPrefix="twitch-videos"
    />
  );
}

function ChannelClips({ login }: { login: string }) {
  const clips = useTwitchChannelClips(login);
  return (
    <TwitchGrid
      {...clips}
      hasNextPage={clips.hasNextPage}
      itemKey={(c) => c.slug}
      render={(c) => <TwitchClipCard clip={c} />}
      empty={m.twitch_no_clips()}
      idPrefix="twitch-clips"
    />
  );
}

function TwitchChannelPage() {
  const { login } = Route.useParams();
  const enabled = useTwitchEnabled();
  const channel = useTwitchChannel(login);
  const [tab, setTab] = useState<Tab>("videos");
  if (!enabled) return <TwitchDisabled />;
  const data = channel.data;
  return (
    <div className="flex flex-col gap-6 pt-2 [animation:page-fade-in_0.2s_ease-out] sm:pt-4">
      <header className="flex flex-wrap items-center gap-4">
        {data?.avatarUrl && (
          <img
            src={proxyImage(data.avatarUrl, "card")}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="font-semibold text-fg text-xl">{data?.displayName ?? login}</h1>
          {data && (
            <p className="text-fg-muted text-sm">
              {m.twitch_followers({ count: data.followers.toLocaleString() })}
            </p>
          )}
          {data?.description && (
            <p className="line-clamp-2 text-fg-soft text-sm">{data.description}</p>
          )}
        </div>
        <TwitchFollowButton login={login} />
        {data?.live && (
          <Link
            to="/twitch/watch"
            search={{ c: login }}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-sm text-white hover:bg-red-700"
          >
            {m.twitch_watch_live()}
          </Link>
        )}
      </header>
      {channel.isError && <p className="text-fg-muted text-sm">{m.twitch_channel_not_found()}</p>}
      <div role="tablist" aria-label={m.twitch_channel_sections()} className="flex gap-2">
        {(["videos", "clips"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${tab === value ? "bg-fg text-app" : "bg-surface-strong text-fg hover:bg-surface-stronger"}`}
          >
            {value === "videos" ? m.twitch_videos() : m.twitch_clips()}
          </button>
        ))}
      </div>
      {tab === "videos" ? <ChannelVideos login={login} /> : <ChannelClips login={login} />}
    </div>
  );
}

export const Route = createFileRoute("/twitch_/channel/$login")({ component: TwitchChannelPage });
