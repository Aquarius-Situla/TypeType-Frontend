import { type RefObject, useRef, useState } from "react";
import { useServerResumeRetry } from "../hooks/use-server-resume-retry";
import { useTwitchVideoPlayback } from "../hooks/use-twitch";
import { useTwitchChaptersVtt } from "../hooks/use-twitch-chapters-vtt";
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
  // After a server restart the player is rebuilt: it resumes where playback was, not where the page opened.
  resumeAtMs: number | null;
  positionRef: RefObject<number | null>;
};

function ResumablePlayer({ id, data, onError, onSecond, resumeAtMs, positionRef }: ResumableProps) {
  const progress = useTwitchVodProgress(id, data.video.lengthSeconds);
  const chaptersVtt = useTwitchChaptersVtt(id, data.video.lengthSeconds);
  if (!progress.ready)
    return <div className={`animate-pulse rounded-xl bg-surface-strong ${TWITCH_STAGE_SIZE}`} />;
  return (
    <TwitchPlayer
      target={{ v: id }}
      src={data.hlsUrl}
      live={false}
      title={data.video.title}
      poster={data.video.previewUrl}
      startTime={resumeAtMs ?? progress.startTime}
      chaptersVtt={chaptersVtt}
      vodChatLogin={data.video.owner.login}
      onTimeUpdate={(positionMs) => {
        positionRef.current = positionMs;
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
  const positionRef = useRef<number | null>(null);
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
              positionRef={positionRef}
              resumeAtMs={resume.retryKey > 0 ? positionRef.current : null}
            />
            <TwitchWatchHeading title={data.video.title} user={data.video.owner} />
          </>
        )}
      </TwitchWatchStage>
    </TwitchWatchLayout>
  );
}
