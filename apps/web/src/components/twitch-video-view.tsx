import { useTwitchVideoPlayback } from "../hooks/use-twitch";
import { useTwitchVodProgress } from "../hooks/use-twitch-vod-progress";
import type { TwitchVideoPlayback } from "../types/twitch";
import { TwitchPlayer } from "./twitch-player";
import { TwitchWatchHeading } from "./twitch-watch-heading";
import { TwitchWatchStage } from "./twitch-watch-stage";

function ResumablePlayer({ id, data }: { id: string; data: TwitchVideoPlayback }) {
  const progress = useTwitchVodProgress(id, data.video.lengthSeconds);
  if (!progress.ready)
    return <div className="aspect-video w-full animate-pulse rounded-xl bg-surface-strong" />;
  return (
    <TwitchPlayer
      target={{ v: id }}
      src={data.hlsUrl}
      live={false}
      title={data.video.title}
      poster={data.video.previewUrl}
      startTime={progress.startTime}
      onTimeUpdate={progress.onTimeUpdate}
      onPause={progress.onPause}
      onSeeked={progress.onSeeked}
      onEnded={progress.onEnded}
    />
  );
}

export function TwitchVideoView({ id }: { id: string }) {
  const { data, isLoading, error } = useTwitchVideoPlayback(id);
  return (
    <TwitchWatchStage loading={isLoading} error={error}>
      {data && (
        <>
          <ResumablePlayer id={id} data={data} />
          <TwitchWatchHeading title={data.video.title} user={data.video.owner} />
        </>
      )}
    </TwitchWatchStage>
  );
}
