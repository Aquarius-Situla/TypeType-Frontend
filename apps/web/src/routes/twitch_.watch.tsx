import { createFileRoute } from "@tanstack/react-router";
import { TwitchClipView } from "../components/twitch-clip-view";
import { TwitchDisabled } from "../components/twitch-grid";
import { TwitchLiveView } from "../components/twitch-live-view";
import { TwitchVideoView } from "../components/twitch-video-view";
import { TwitchWatchMessage } from "../components/twitch-watch-stage";
import { useTwitchEnabled } from "../hooks/use-twitch";
import { m } from "../paraglide/messages.js";

type WatchSearch = { c?: string; v?: string; clip?: string };

function validateSearch(search: Record<string, unknown>): WatchSearch {
  const pick = (key: string) => {
    const value = search[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return typeof value === "string" && value ? value : undefined;
  };
  return { c: pick("c"), v: pick("v"), clip: pick("clip") };
}

function TwitchWatchPage() {
  const { c, v, clip } = Route.useSearch();
  const enabled = useTwitchEnabled();
  if (!enabled) return <TwitchDisabled />;
  return (
    <div className="pt-2 sm:pt-4">
      {c ? (
        <TwitchLiveView key={c} login={c} />
      ) : v ? (
        <TwitchVideoView key={v} id={v} />
      ) : clip ? (
        <TwitchClipView slug={clip} />
      ) : (
        <TwitchWatchMessage text={m.twitch_load_error()} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/twitch_/watch")({
  validateSearch,
  component: TwitchWatchPage,
});
