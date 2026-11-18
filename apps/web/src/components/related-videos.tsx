import { useMemo } from "react";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useVideoProgressMap } from "../hooks/use-progress";
import { useSettings } from "../hooks/use-settings";
import { videoProgressUrl } from "../lib/video-progress";
import type { VideoStream } from "../types/stream";
import { AutoplayToggle } from "./autoplay-toggle";
import { RelatedCard } from "./related-card";
import { RelatedCardSkeleton } from "./related-card-skeleton";

const SKELETON_KEYS = Array.from({ length: 4 }, (_, i) => `rs-${i}`);

type Props = {
  streams: VideoStream[];
  isLoading?: boolean;
};

function uniqueStreams(streams: VideoStream[]): VideoStream[] {
  const seen = new Set<string>();
  const unique: VideoStream[] = [];
  for (const stream of streams) {
    if (seen.has(stream.id)) continue;
    seen.add(stream.id);
    unique.push(stream);
  }
  return unique;
}

export function RelatedVideos({ streams, isLoading = false }: Props) {
  const { settings } = useSettings();
  const { filter } = useBlockedFilter();
  const visible = useMemo(() => uniqueStreams(filter(streams)), [filter, streams]);
  const progressByUrl = useVideoProgressMap(visible);
  return (
    <div className="watch-related-list flex flex-col gap-3">
      <div className="watch-related-header">
        <AutoplayToggle />
      </div>
      {isLoading
        ? SKELETON_KEYS.map((k) => <RelatedCardSkeleton key={k} size={settings.relatedVideoSize} />)
        : visible.map((stream, index) => (
            <div
              key={stream.id}
              className="animate-card-pop-in"
              style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}
            >
              <RelatedCard
                stream={stream}
                relatedStreams={visible}
                size={settings.relatedVideoSize}
                progressMs={progressByUrl.get(videoProgressUrl(stream))?.position}
              />
            </div>
          ))}
    </div>
  );
}
