import { createFileRoute } from "@tanstack/react-router";
import { TwitchClipView } from "../components/twitch-clip-view";
import { TwitchDisabled } from "../components/twitch-grid";
import { TwitchLiveView } from "../components/twitch-live-view";
import { TwitchVideoView } from "../components/twitch-video-view";
import { TwitchWatchMessage } from "../components/twitch-watch-stage";
import { useTwitchEnabled } from "../hooks/use-twitch";
import { m } from "../paraglide/messages.js";

// t opens a past broadcast at that second, or rewinds the running live of c to it.
type WatchSearch = { c?: string; v?: string; clip?: string; t?: number };

function validateSearch(search: Record<string, unknown>): WatchSearch {
  const pick = (key: string) => {
    const value = search[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return typeof value === "string" && value ? value : undefined;
  };
  const t = Number(search.t);
  return {
    c: pick("c"),
    v: pick("v"),
    clip: pick("clip"),
    t: Number.isFinite(t) && t >= 0 ? Math.floor(t) : undefined,
  };
}

function TwitchWatchPage() {
  const { c, v, clip, t } = Route.useSearch();
  const enabled = useTwitchEnabled();
  if (!enabled) return <TwitchDisabled />;
  return (
    <div className="pt-2 sm:pt-4">
      {c ? (
        <TwitchLiveView key={c} login={c} rewindSeconds={t} />
      ) : v ? (
        <TwitchVideoView key={v} id={v} startAtSeconds={t} />
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
