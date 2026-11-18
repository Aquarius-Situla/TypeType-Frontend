import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { m } from "../paraglide/messages.js";
import type { TwitchStream } from "../types/twitch";

function uptime(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  const h = Math.floor(seconds / 3600);
  const min = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}:${String(min).padStart(2, "0")}` : `0:${String(min).padStart(2, "0")}`;
}

export function TwitchLiveMeta({ stream }: { stream: TwitchStream }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-fg-muted text-sm">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-red-600" aria-hidden="true" />
        {m.twitch_viewers({ count: stream.viewers.toLocaleString() })}
      </span>
      {stream.startedAt && (
        <span title={new Date(stream.startedAt).toLocaleString()}>
          {m.twitch_live_for({ time: uptime(stream.startedAt, now) })}
        </span>
      )}
      {stream.game?.slug && (
        <Link
          to="/twitch/category/$slug"
          params={{ slug: stream.game.slug }}
          className="font-medium text-[#a970ff] hover:underline"
        >
          {stream.game.name}
        </Link>
      )}
      {stream.tags?.slice(0, 6).map((tag) => (
        <Link
          key={tag}
          to="/twitch/tag/$tag"
          params={{ tag }}
          aria-label={m.twitch_tag_link({ tag })}
          className="rounded-full bg-surface-strong px-2 py-0.5 text-fg-soft text-xs transition-colors hover:bg-border hover:text-fg"
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
