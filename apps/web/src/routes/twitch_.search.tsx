import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TwitchGameCard, TwitchStreamCard } from "../components/twitch-cards";
import { TwitchDisabled, TwitchGrid } from "../components/twitch-grid";
import { useTwitchEnabled, useTwitchSearch } from "../hooks/use-twitch";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { TwitchChannel, TwitchGame, TwitchSearchType, TwitchStream } from "../types/twitch";

function validateSearch(search: Record<string, unknown>): { q: string } {
  return { q: typeof search.q === "string" ? search.q.slice(0, 100) : "" };
}

function ChannelRow({ channel }: { channel: TwitchChannel }) {
  return (
    <Link
      to="/twitch/channel/$login"
      params={{ login: channel.login }}
      className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-strong"
    >
      {channel.avatarUrl && (
        <img
          src={proxyImage(channel.avatarUrl, "card")}
          alt=""
          className="h-12 w-12 rounded-full object-cover"
        />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-fg text-sm">{channel.displayName}</span>
        <span className="text-fg-muted text-xs">
          {m.twitch_followers({ count: channel.followers.toLocaleString() })}
          {channel.live ? ` · ${m.ui_live()}` : ""}
        </span>
      </span>
    </Link>
  );
}

function Results({ q, type }: { q: string; type: TwitchSearchType }) {
  const channels = useTwitchSearch<TwitchChannel>(type === "channels" ? q : "", "channels");
  const games = useTwitchSearch<TwitchGame>(type === "games" ? q : "", "games");
  const streams = useTwitchSearch<TwitchStream>(type === "streams" ? q : "", "streams");
  if (type === "channels") {
    return (
      <div className="flex flex-col gap-1">
        {channels.items.map((c) => (
          <ChannelRow key={c.id} channel={c} />
        ))}
        {!channels.isLoading && channels.items.length === 0 && (
          <p className="py-16 text-center text-fg-muted text-sm">{m.twitch_no_results()}</p>
        )}
      </div>
    );
  }
  if (type === "games") {
    return (
      <div className="flex flex-wrap gap-3">
        {games.items.map((g) => (
          <TwitchGameCard key={g.id} game={g} />
        ))}
        {!games.isLoading && games.items.length === 0 && (
          <p className="w-full py-16 text-center text-fg-muted text-sm">{m.twitch_no_results()}</p>
        )}
      </div>
    );
  }
  return (
    <TwitchGrid
      {...streams}
      hasNextPage={streams.hasNextPage}
      itemKey={(s) => s.id}
      render={(s) => <TwitchStreamCard stream={s} />}
      empty={m.twitch_no_results()}
      idPrefix="twitch-search"
    />
  );
}

function TwitchSearchPage() {
  const { q } = Route.useSearch();
  const enabled = useTwitchEnabled();
  const [type, setType] = useState<TwitchSearchType>("channels");
  if (!enabled) return <TwitchDisabled />;
  const labels: Record<TwitchSearchType, string> = {
    channels: m.twitch_search_channels(),
    games: m.twitch_categories(),
    streams: m.twitch_search_lives(),
  };
  return (
    <div className="flex flex-col gap-6 pt-2 sm:pt-4">
      <h1 className="font-semibold text-fg text-xl">{m.twitch_search_title({ query: q })}</h1>
      <div role="tablist" aria-label={m.twitch_search_placeholder()} className="flex gap-2">
        {(Object.keys(labels) as TwitchSearchType[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={type === value}
            onClick={() => setType(value)}
            className={`rounded-full px-4 py-1.5 font-medium text-sm transition-colors ${type === value ? "bg-fg text-app" : "bg-surface-strong text-fg hover:bg-surface-stronger"}`}
          >
            {labels[value]}
          </button>
        ))}
      </div>
      {q ? <Results q={q} type={type} /> : null}
    </div>
  );
}

export const Route = createFileRoute("/twitch_/search")({
  validateSearch,
  component: TwitchSearchPage,
});
