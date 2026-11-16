import { buildChaptersVtt, buildSponsorBlockChaptersVtt } from "../lib/chapters-vtt";
import { proxyUrl } from "../lib/proxy";
import { buildThumbnailVtt } from "../lib/thumbnail-vtt";
import type { SponsorBlockSegmentItem } from "../types/api";
import type { VideoStream } from "../types/stream";
import { useKeyedObjectUrl } from "./use-keyed-object-url";

function previewFramesKey(stream: VideoStream): string {
  return (stream.previewFrames ?? [])
    .map(
      (frame) =>
        `${frame.frameWidth}:${frame.frameHeight}:${frame.durationPerFrame}:${frame.urls.join(",")}`,
    )
    .join("|");
}

function streamSegmentsKey(stream: VideoStream): string {
  return (stream.streamSegments ?? [])
    .map((segment) => `${segment.startTimeSeconds}:${segment.title}`)
    .join("|");
}

function sponsorBlockSegmentsKey(segments: SponsorBlockSegmentItem[] | undefined): string {
  return (segments ?? [])
    .map(
      (segment) => `${segment.startTime}:${segment.endTime}:${segment.category}:${segment.action}`,
    )
    .join("|");
}

export function useWatchVttAssets(
  stream: VideoStream,
  sponsorBlockSegments: SponsorBlockSegmentItem[] | undefined,
  showSponsorBlockChapters: boolean,
) {
  const thumbnailKey = `${stream.duration}:${previewFramesKey(stream)}`;
  const chaptersKey = `${showSponsorBlockChapters}:${stream.duration}:${streamSegmentsKey(stream)}:${sponsorBlockSegmentsKey(sponsorBlockSegments)}`;
  const thumbnailVtt = useKeyedObjectUrl(thumbnailKey, () =>
    stream.previewFrames
      ? buildThumbnailVtt(
          stream.previewFrames.map((frame) => ({ ...frame, urls: frame.urls.map(proxyUrl) })),
          stream.duration,
        )
      : null,
  );
  const chaptersVtt = useKeyedObjectUrl(chaptersKey, () =>
    stream.streamSegments
      ? buildChaptersVtt(stream.streamSegments, stream.duration)
      : showSponsorBlockChapters
        ? buildSponsorBlockChaptersVtt(sponsorBlockSegments ?? [], stream.duration)
        : null,
  );

  return {
    thumbnailVtt: thumbnailVtt ?? undefined,
    chaptersVtt: chaptersVtt ?? undefined,
  };
}
