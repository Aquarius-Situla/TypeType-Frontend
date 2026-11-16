import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { proxyImage } from "../lib/proxy";
import type { TwitchUser } from "../types/twitch";
import { TwitchFollowButton } from "./twitch-follow-button";

type Props = { title: string; user: TwitchUser; detail?: string; meta?: ReactNode };

export function TwitchWatchHeading({ title, user, detail, meta }: Props) {
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
        <TwitchFollowButton login={user.login} />
      </div>
      {meta}
    </div>
  );
}
