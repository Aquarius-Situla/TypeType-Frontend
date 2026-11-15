import { useState } from "react";
import { useServerResumeRetry } from "../hooks/use-server-resume-retry";
import { useTwitchVideoPlayback } from "../hooks/use-twitch";
import { useTwitchVodProgress } from "../hooks/use-twitch-vod-progress";
import { TWITCH_STAGE_SIZE } from "../lib/twitch-stage-size";
import type { TwitchVideoPlayback } from "../types/twitch";
import { TwitchPlayer } from "./twitch-player";
import { TwitchVodChat } from "./twitch-vod-chat";
import { TwitchWatchHeading } from "./twitch-watch-heading";
import { TwitchWatchLayout } from "./twitch-watch-layout";
import { TwitchWatchStage } from "./twitch-watch-stage";

type ResumableProps = {
  id: string;
  data: TwitchVideoPlayback;
  onError: () => void;
  onSecond: (seconds: number) => void;
};

function ResumablePlayer({ id, data, onError, onSecond }: ResumableProps) {
  const progress = useTwitchVodProgress(id, data.video.lengthSeconds);
  if (!progress.ready)
    return <div className={`animate-pulse rounded-xl bg-surface-strong ${TWITCH_STAGE_SIZE}`} />;
  return (
    <TwitchPlayer
      target={{ v: id }}
      src={data.hlsUrl}
      live={false}
      title={data.video.title}
      poster={data.video.previewUrl}
      startTime={progress.startTime}
      onTimeUpdate={(positionMs) => {
        progress.onTimeUpdate(positionMs);
        onSecond(Math.floor(positionMs / 1000));
      }}
      onPause={progress.onPause}
      onSeeked={progress.onSeeked}
      onEnded={progress.onEnded}
      onError={onError}
    />
  );
}

export function TwitchVideoView({ id }: { id: string }) {
  const { data, isLoading, error } = useTwitchVideoPlayback(id);
  const resume = useServerResumeRetry();
  const [seconds, setSeconds] = useState(0);
  return (
    <TwitchWatchLayout
      chat={data && <TwitchVodChat videoId={id} login={data.video.owner.login} seconds={seconds} />}
    >
      <TwitchWatchStage loading={isLoading} error={error} ready={data !== undefined}>
        {data && (
          <>
            <ResumablePlayer
              key={resume.retryKey}
              id={id}
              data={data}
              onError={resume.onError}
              onSecond={setSeconds}
            />
            <TwitchWatchHeading title={data.video.title} user={data.video.owner} />
          </>
        )}
      </TwitchWatchStage>
    </TwitchWatchLayout>
  );
}
