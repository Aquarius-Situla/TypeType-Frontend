import { createFileRoute } from "@tanstack/react-router";
import { TwitchStreamCard } from "../components/twitch-cards";
import { TwitchDisabled, TwitchGrid } from "../components/twitch-grid";
import { useTwitchEnabled, useTwitchGameStreams } from "../hooks/use-twitch";
import { m } from "../paraglide/messages.js";

function TwitchCategoryPage() {
  const { slug } = Route.useParams();
  const enabled = useTwitchEnabled();
  const streams = useTwitchGameStreams(slug);
  if (!enabled) return <TwitchDisabled />;
  return (
    <div className="flex flex-col gap-6 pt-2 [animation:page-fade-in_0.2s_ease-out] sm:pt-4">
      <h1 className="font-semibold text-fg text-xl">{streams.game?.name ?? slug}</h1>
      <TwitchGrid
        {...streams}
        hasNextPage={streams.hasNextPage}
        itemKey={(s) => s.id}
        render={(s) => <TwitchStreamCard stream={s} />}
        empty={m.twitch_no_lives()}
        idPrefix="twitch-category"
      />
    </div>
  );
}

export const Route = createFileRoute("/twitch_/category/$slug")({ component: TwitchCategoryPage });
