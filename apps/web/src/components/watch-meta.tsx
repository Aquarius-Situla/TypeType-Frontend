import type { ReactNode } from "react";
import type { WatchAudioOnlyControls } from "../hooks/use-watch-audio-only-playback";
import type { VideoStream } from "../types/stream";
import { BiliBiliSessionBanner } from "./bilibili-session-banner";
import { WatchActions } from "./watch-actions";
import { WatchComments } from "./watch-comments";
import { WatchDescription } from "./watch-description";
import { WatchInfo } from "./watch-info";

type Props = {
  stream: VideoStream;
  showComments?: boolean;
  onSeekTimestamp?: (seconds: number) => void;
  audioOnly: WatchAudioOnlyControls;
  beforeComments?: ReactNode;
};

export function WatchMeta({
  stream,
  showComments = true,
  onSeekTimestamp,
  audioOnly,
  beforeComments,
}: Props) {
  return (
    <>
      <WatchInfo stream={stream} />
      <BiliBiliSessionBanner key={`session-${stream.id}`} />
      <WatchActions stream={stream} audioOnly={audioOnly} />
      {stream.description && (
        <WatchDescription
          description={stream.description}
          videoUrl={stream.id}
          uploadedAt={stream.publishedAt}
          onSeekTimestamp={onSeekTimestamp}
        />
      )}
      {beforeComments}
      {showComments && (
        <WatchComments
          key={`comments-${stream.id}`}
          videoUrl={stream.id}
          onSeekTimestamp={onSeekTimestamp}
        />
      )}
    </>
  );
}
