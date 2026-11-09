import { useMemo } from "react";
import { useVideoProgressMap } from "../hooks/use-progress";
import { useSettings } from "../hooks/use-settings";
import { videoGridClassName } from "../lib/layout-preferences";
import { videoProgressUrl } from "../lib/video-progress";
import type { VideoStream } from "../types/stream";
import { SelectableCardOverlay } from "./selectable-card-overlay";
import { VideoCard } from "./video-card";

export type VideoGridSelection = {
  selected: ReadonlySet<string>;
  onToggle: (stream: VideoStream) => void;
  canSelect: (stream: VideoStream) => boolean;
};

type VideoGridProps = {
  streams: VideoStream[];
  onCardOpen?: (stream: VideoStream) => void;
  onCardImpression?: (stream: VideoStream) => void;
  listId?: string;
  selection?: VideoGridSelection;
};

export function VideoGrid({
  streams,
  onCardOpen,
  onCardImpression,
  listId,
  selection,
}: VideoGridProps) {
  const { settings } = useSettings();
  const unique = useMemo(() => {
    const seen = new Set<string>();
    const result: VideoStream[] = [];
    for (const stream of streams) {
      if (seen.has(stream.id)) continue;
      seen.add(stream.id);
      result.push(stream);
    }
    return result;
  }, [streams]);
  const progressByUrl = useVideoProgressMap(unique);
  return (
    <div className={videoGridClassName(settings.videoGridColumns)}>
      {unique.map((stream, index) => (
        <div
          key={stream.id}
          className="relative animate-card-pop-in"
          style={{ animationDelay: `${Math.min(index * 45, 270)}ms` }}
        >
          <VideoCard
            stream={stream}
            onOpen={onCardOpen ? () => onCardOpen(stream) : undefined}
            onImpression={onCardImpression ? () => onCardImpression(stream) : undefined}
            listId={listId}
            relatedStreams={unique}
            progressMs={progressByUrl.get(videoProgressUrl(stream))?.position}
          />
          {selection && (
            <SelectableCardOverlay
              title={stream.title}
              selected={selection.selected.has(stream.id)}
              disabled={!selection.canSelect(stream)}
              onToggle={() => selection.onToggle(stream)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
