import type { ReactNode } from "react";
import { useMobile } from "../hooks/use-mobile";
import { useSettings } from "../hooks/use-settings";
import type { WatchAudioOnlyControls } from "../hooks/use-watch-audio-only-playback";
import { watchSecondaryPanelClassName } from "../lib/layout-preferences";
import { useLiveChatStore } from "../lib/live-chat-store";
import { detectProvider } from "../lib/provider";
import type { VideoStream } from "../types/stream";
import { LiveChatPanel } from "./live-chat-panel";
import { RelatedVideos } from "./related-videos";
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

export function getWatchSecondaryMetaContainerClass(hasSideContent: boolean): string {
  return hasSideContent
    ? "min-w-0 flex-[2] max-w-[1200px] flex flex-col gap-4"
    : "min-w-0 w-full flex-1 max-w-full flex flex-col gap-4";
}

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
  const isMobile = useMobile();
  const liveChatOpen = useLiveChatStore((state) => state.open && state.videoId === stream.id);
  const chatEnded = useLiveChatStore((state) => state.endedVideoId === stream.id);
  const closeLiveChat = useLiveChatStore((state) => state.close);
  const streamIsLive =
    stream.streamType === "live_stream" || stream.streamType === "audio_live_stream";
  const showLiveChat = streamIsLive && detectProvider(stream.id) === "youtube" && liveChatOpen;
  const liveChat = showLiveChat ? (
    <LiveChatPanel
      videoUrl={stream.id}
      ended={chatEnded}
      onClose={closeLiveChat}
      className={
        isMobile
          ? "h-[62dvh] max-h-[62dvh] w-full"
          : "h-[calc(100dvh-8rem)] min-h-[24rem] max-h-[44rem] w-full"
      }
    />
  ) : null;
  const liveChatOverlay =
    isMobile && liveChat ? (
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-40 px-2 pb-2">
        {liveChat}
      </div>
    ) : null;
  const hasPlaylistPanel = Boolean(playlistPanel);
  const hasRelatedStreams = relatedStreams.length > 0;
  const panelClassName = watchSecondaryPanelClassName(
    settings.relatedVideoSize,
    showLiveChat && !isMobile,
  );

  if (!cinemaMode) {
    if (!(hasPlaylistPanel || hasRelatedStreams || (liveChat && !isMobile))) return liveChatOverlay;

    return (
      <>
        <div className={panelClassName}>
          {!isMobile && liveChat}
          {playlistPanel}
          {hasRelatedStreams && <RelatedVideos streams={relatedStreams} />}
        </div>
        {liveChatOverlay}
      </>
    );
  }

  const hasSideContent = hasPlaylistPanel || hasRelatedStreams || (liveChat && !isMobile);
  const metaContainerClassName = getWatchSecondaryMetaContainerClass(hasSideContent);

  return (
    <>
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
            {!isMobile && liveChat}
            {playlistPanel}
            {hasRelatedStreams && <RelatedVideos streams={relatedStreams} />}
          </div>
        )}
      </div>
      {liveChatOverlay}
    </>
  );
}
