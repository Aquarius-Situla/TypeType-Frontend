import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { TwitchGameCard, TwitchStreamCard } from "../components/twitch-cards";
import { TwitchDisabled, TwitchGrid } from "../components/twitch-grid";
import { TwitchIcon } from "../components/twitch-icon";
import {
  useTwitchAccount,
  useTwitchEnabled,
  useTwitchFollowedLive,
  useTwitchGames,
  useTwitchStreams,
} from "../hooks/use-twitch";
import { m } from "../paraglide/messages.js";

function TwitchSearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate({ to: "/twitch/search", search: { q } });
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={m.twitch_search_placeholder()}
        aria-label={m.twitch_search_placeholder()}
        className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-fg text-sm sm:w-80 sm:flex-none"
      />
    </form>
  );
}

function FollowedLive() {
  const followed = useTwitchFollowedLive();
  if (followed.items.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-semibold text-fg text-lg">{m.twitch_followed_live()}</h2>
      <TwitchGrid
        {...followed}
        hasNextPage={followed.hasNextPage}
        itemKey={(s) => s.id}
        render={(s) => <TwitchStreamCard stream={s} />}
        empty=""
        idPrefix="twitch-followed"
      />
    </section>
  );
}

function TwitchHome() {
  const enabled = useTwitchEnabled();
  const games = useTwitchGames();
  const streams = useTwitchStreams();
  const account = useTwitchAccount();
  if (!enabled) return <TwitchDisabled />;
  return (
    <div className="flex flex-col gap-8 pt-2 [animation:page-fade-in_0.2s_ease-out] sm:pt-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-semibold text-fg text-xl">
          <TwitchIcon className="h-6 w-6 text-[#9146ff]" />
          {m.nav_live()}
        </h1>
        <div className="flex items-center gap-3">
          <TwitchSearchBox />
          <Link
            to="/twitch-session"
            search={{ channel: undefined }}
            className="text-fg-muted text-sm hover:text-fg"
          >
            {account.data?.linked
              ? (account.data.displayName ?? account.data.login)
              : m.twitch_link_account()}
          </Link>
        </div>
      </header>
      {account.data?.linked && <FollowedLive />}
      {games.items.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold text-fg text-lg">{m.twitch_categories()}</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {games.items.slice(0, 20).map((game) => (
              <TwitchGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-fg text-lg">{m.twitch_top_lives()}</h2>
        <TwitchGrid
          {...streams}
          hasNextPage={streams.hasNextPage}
          itemKey={(s) => s.id}
          render={(s) => <TwitchStreamCard stream={s} />}
          empty={m.twitch_no_lives()}
          idPrefix="twitch-streams"
        />
      </section>
    </div>
  );
}

export const Route = createFileRoute("/twitch")({ component: TwitchHome });
