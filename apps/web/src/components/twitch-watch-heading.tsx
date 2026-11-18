import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { TwitchUser } from "../types/twitch";
import { TwitchAudioOnlyButton } from "./twitch-audio-only-button";
import { TwitchFollowButton } from "./twitch-follow-button";

type Props = {
  title: string;
  user: TwitchUser;
  detail?: string;
  meta?: ReactNode;
  audioOnly?: boolean;
  // The channel of a past broadcast still recording: its live is one click away.
  liveLogin?: string;
};

export function TwitchWatchHeading({
  title,
  user,
  detail,
  meta,
  audioOnly = false,
  liveLogin,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-semibold text-fg text-lg leading-snug">{title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        {user.avatarUrl && (
          <img
            src={proxyImage(user.avatarUrl, "card")}
            alt=""
            className="size-9 rounded-full object-cover"
          />
        )}
        <p className="min-w-0 flex-1 text-fg-muted text-sm">
          <Link
            to="/twitch/channel/$login"
            params={{ login: user.login }}
            className="font-medium text-fg hover:underline"
          >
            {user.displayName || user.login}
          </Link>
          {detail ? ` · ${detail}` : ""}
        </p>
        {liveLogin && (
          <Link
            to="/twitch/watch"
            search={{ c: liveLogin }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-sm text-white hover:bg-red-700"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-white" />
            {m.twitch_back_to_live()}
          </Link>
        )}
        {audioOnly && <TwitchAudioOnlyButton />}
        <TwitchFollowButton login={user.login} />
      </div>
      {meta}
    </div>
  );
}
