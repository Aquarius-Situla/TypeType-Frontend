import type { ReactNode } from "react";
import { useSettings } from "../hooks/use-settings";
import type { WatchAudioOnlyControls } from "../hooks/use-watch-audio-only-playback";
import { relatedVideoPanelClassName } from "../lib/layout-preferences";
import type { VideoStream } from "../types/stream";
import { RelatedVideos } from "./related-videos";
import { getWatchSecondaryMetaContainerClass } from "./watch-layout-classes";
import { WatchMeta } from "./watch-meta";

type Props = {
  cinemaMode: boolean;
  stream: VideoStream;
  relatedStreams: VideoStream[];
  showComments: boolean;
  playlistPanel?: ReactNode;
  onSeekTimestamp: (seconds: number) => void;
  audioOnly: WatchAudioOnlyControls;
};

export function WatchSecondaryContent({
  cinemaMode,
  stream,
  relatedStreams,
  showComments,
  playlistPanel,
  onSeekTimestamp,
  audioOnly,
}: Props) {
  const { settings } = useSettings();
  const hasPlaylistPanel = Boolean(playlistPanel);
  const hasRelatedStreams = relatedStreams.length > 0;
  const panelClassName = `w-full lg:flex-1 ${relatedVideoPanelClassName(settings.relatedVideoSize)} flex flex-col gap-6`;

  if (!cinemaMode) {
    if (!(hasPlaylistPanel || hasRelatedStreams)) return null;

    return (
      <div className={panelClassName}>
        {playlistPanel}
        {hasRelatedStreams && <RelatedVideos streams={relatedStreams} />}
      </div>
    );
  }

  const hasSideContent = hasPlaylistPanel || hasRelatedStreams;
  const metaContainerClassName = getWatchSecondaryMetaContainerClass(hasSideContent);

  return (
    <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-6 px-4 lg:flex-row lg:items-start">
      <div className={metaContainerClassName}>
        <WatchMeta
          stream={stream}
          showComments={showComments}
          onSeekTimestamp={onSeekTimestamp}
          audioOnly={audioOnly}
        />
      </div>
      {hasSideContent && (
        <div className={panelClassName}>
          {playlistPanel}
          {hasRelatedStreams && <RelatedVideos streams={relatedStreams} />}
        </div>
      )}
    </div>
  );
}
