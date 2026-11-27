import { createFileRoute } from "@tanstack/react-router";
import { TwitchStreamCard } from "../components/twitch-cards";
import { TwitchDisabled, TwitchGrid } from "../components/twitch-grid";
import { TwitchLanguageFilter } from "../components/twitch-language-filter";
import { useTwitchEnabled, useTwitchTagStreams } from "../hooks/use-twitch";
import { m } from "../paraglide/messages.js";

function TwitchTagPage() {
  const { tag } = Route.useParams();
  const enabled = useTwitchEnabled();
  const streams = useTwitchTagStreams(tag);
  if (!enabled) return <TwitchDisabled />;
  return (
    <div className="flex flex-col gap-6 pt-2 [animation:page-fade-in_0.2s_ease-out] sm:pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-fg text-xl">{m.twitch_tag_title({ tag })}</h1>
        <TwitchLanguageFilter />
      </div>
      <TwitchGrid
        {...streams}
        hasNextPage={streams.hasNextPage}
        itemKey={(s) => s.id}
        render={(s) => <TwitchStreamCard stream={s} />}
        empty={m.twitch_no_lives()}
        idPrefix="twitch-tag"
      />
    </div>
  );
}

export const Route = createFileRoute("/twitch_/tag/$tag")({ component: TwitchTagPage });
