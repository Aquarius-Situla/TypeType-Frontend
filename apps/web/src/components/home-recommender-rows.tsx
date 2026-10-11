import { ThumbsDown } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useVideoProgressMap } from "../hooks/use-progress";
import { useRecommenderFeedback } from "../hooks/use-recommender-feedback";
import { useSettings } from "../hooks/use-settings";
import { videoGridClassName } from "../lib/layout-preferences";
import { spreadCreators } from "../lib/spread-creators";
import { videoProgressUrl } from "../lib/video-progress";
import { m } from "../paraglide/messages.js";
import { EMPTY_REFUSED_VIDEOS, useRefusedVideosStore } from "../stores/refused-videos-store";
import type { HomeRecommendationRow } from "../types/recommender";
import type { VideoStream } from "../types/stream";
import { reasonLabel } from "./algorithm/algorithm-labels";
import { HomeRefusedCard } from "./home-refused-card";
import { VideoCard } from "./video-card";

const ROW_VISIBLE = 12;
const ROW_SLACK = 4;

type Props = {
  rows: HomeRecommendationRow[];
  streams: VideoStream[];
  flat?: boolean;
};

export function HomeRecommenderRows({ rows, streams, flat = false }: Props) {
  const { settings } = useSettings();
  const { me } = useAuth();
  const profileId = me?.id ?? null;
  const { send } = useRecommenderFeedback(false);
  const byUrl = useMemo(() => new Map(streams.map((stream) => [stream.id, stream])), [streams]);
  const progressByUrl = useVideoProgressMap(streams);
  const refused = useRefusedVideosStore((state) =>
    profileId ? state.refused[profileId] ?? EMPTY_REFUSED_VIDEOS : EMPTY_REFUSED_VIDEOS,
  );
  const refuse = useRefusedVideosStore((state) => state.refuse);
  const restore = useRefusedVideosStore((state) => state.restore);

  const notForMe = (stream: VideoStream) => {
    if (!profileId) return;
    refuse(profileId, stream.id, { id: null, explained: false });
    send.mutate(
      {
        kind: "video",
        verdict: "not_for_me",
        videoUrl: stream.id,
        title: stream.title,
        channelName: stream.channelName,
        thumbnailUrl: stream.thumbnail,
      },
      {
        onSuccess: (saved) => refuse(profileId, stream.id, { id: saved.id, explained: false }),
        onError: () => restore(profileId, stream.id),
      },
    );
  };

  const subjectOf = useMemo(() => {
    const found = new Map<string, { id: string; title: string }>();
    for (const row of rows) {
      if (row.reason !== "topic" || !row.reasonRef) continue;
      for (const url of row.videoUrls) found.set(url, { id: row.reasonRef, title: row.title });
    }
    return found;
  }, [rows]);
  const [opened, setOpened] = useState<ReadonlySet<string>>(new Set());
  // The order each row already showed: when more videos arrive, those stay in place.
  const settled = useRef(new Map<string, string[]>());
  const spread = (rowId: string, listed: VideoStream[]) => {
    const before = (settled.current.get(rowId) ?? []).flatMap((id) => byUrl.get(id) ?? []);
    const order = spreadCreators(
      listed,
      (stream) => stream.channelUrl || stream.channelName,
      before,
    );
    settled.current.set(
      rowId,
      order.map((stream) => stream.id),
    );
    return order;
  };
  const shownRows = useMemo(
    () =>
      flat
        ? [
            {
              id: "all",
              title: "",
              reason: "",
              reasonRef: null,
              videoUrls: rows.flatMap((row) => row.videoUrls),
            },
          ]
        : rows,
    [flat, rows],
  );

  return (
    <div className="flex flex-col gap-8">
      {shownRows.map((row) => {
        const listed = row.videoUrls.flatMap((url) => byUrl.get(url) ?? []);
        // The recommender lists a creator's videos side by side: they are spread apart, in the
        // one grid as in a titled row, so the first cards of a row are not one creator's.
        const every = spread(row.id, listed);
        if (every.length === 0) return null;
        const folded = !flat && !opened.has(row.id) && every.length > ROW_VISIBLE + ROW_SLACK;
        const videos = folded ? every.slice(0, ROW_VISIBLE) : every;
        return (
          <section key={row.id} className="flex flex-col gap-3">
            {!flat && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-base font-semibold text-fg">{row.title}</h2>
                <p className="text-xs text-fg-soft">{reasonLabel(row.reason)}</p>
              </div>
            )}
            <div className={videoGridClassName(settings.videoGridColumns)}>
              {videos.map((stream) => {
                const refusal = refused[stream.id];
                if (refusal)
                  return (
                    <HomeRefusedCard
                      key={stream.id}
                      url={stream.id}
                      refusal={refusal}
                      profileId={profileId ?? ""}
                      subject={subjectOf.get(stream.id)}
                    />
                  );
                return (
                  <div key={stream.id} className="group/card flex flex-col gap-1.5">
                    <VideoCard
                      stream={stream}
                      relatedStreams={videos}
                      progressMs={progressByUrl.get(videoProgressUrl(stream))?.position}
                    />
                    <button
                      type="button"
                      onClick={() => notForMe(stream)}
                      className="flex w-fit items-center gap-1.5 text-xs text-fg-soft transition-[color,opacity] duration-200 hover:text-fg focus-visible:opacity-100 group-focus-within/card:opacity-100 group-hover/card:opacity-100 disabled:cursor-not-allowed [@media(hover:hover)]:opacity-0"
                    >
                      <ThumbsDown className="size-3.5" aria-hidden="true" />
                      {m.home_algo_not_for_me()}
                    </button>
                  </div>
                );
              })}
            </div>
            {folded && (
              <button
                type="button"
                onClick={() => setOpened(new Set([...opened, row.id]))}
                className="w-fit text-xs text-fg-muted transition-colors hover:text-fg"
              >
                {m.home_algo_row_more({ count: every.length - videos.length })}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
