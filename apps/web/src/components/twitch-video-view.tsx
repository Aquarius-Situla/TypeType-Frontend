import { useNavigate } from "@tanstack/react-router";
import { type RefObject, useEffect, useRef, useState } from "react";
import { useServerResumeRetry } from "../hooks/use-server-resume-retry";
import { useTwitchChannel, useTwitchVideoPlayback } from "../hooks/use-twitch";
import { useTwitchChaptersVtt } from "../hooks/use-twitch-chapters-vtt";
import { useTwitchVodProgress } from "../hooks/use-twitch-vod-progress";
import { TWITCH_STAGE_SIZE } from "../lib/twitch-stage-size";
import type { TwitchVideoPlayback } from "../types/twitch";
import { LoadingMascot } from "./loading-mascot";
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
  // A second asked by the link, as from the live rewind; it wins over the saved progress.
  startAtMs: number | null;
  positionRef: RefObject<number | null>;
};

function ResumablePlayer({
  id,
  data,
  onError,
  onSecond,
  resumeAtMs,
  startAtMs,
  positionRef,
}: ResumableProps) {
  const progress = useTwitchVodProgress(id, data.video.lengthSeconds, data.video.recording);
  const chaptersVtt = useTwitchChaptersVtt(id, data.video.lengthSeconds);
  if (!progress.ready)
    return (
      <div className={`overflow-hidden rounded-xl bg-black ${TWITCH_STAGE_SIZE}`}>
        <LoadingMascot variant="video-landscape" surface="fill" />
      </div>
    );
  return (
    <TwitchPlayer
      target={{ v: id }}
      src={data.hlsUrl}
      audioSrc={data.audioUrl}
      live={false}
      title={data.video.title}
      poster={data.video.previewUrl}
      startTime={resumeAtMs ?? startAtMs ?? progress.startTime}
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

const CHANNEL_CHECK_MS = 60_000;

// The recording of a running live opens in the live page, which plays it with the live controls and chat.
function useRunningLiveRedirect(
  id: string,
  video: TwitchVideoPlayback["video"] | undefined,
  startAtSeconds?: number,
) {
  const navigate = useNavigate();
  const login = video?.recording ? video.owner.login : "";
  const channel = useTwitchChannel(login, CHANNEL_CHECK_MS);
  const progress = useTwitchVodProgress(id, video?.lengthSeconds ?? 0, true);
  const running = Boolean(login) && channel.data?.live?.archive?.id === id;
  const seconds = startAtSeconds ?? (progress.ready ? Math.floor(progress.startTime / 1000) : null);
  useEffect(() => {
    if (running && seconds !== null)
      void navigate({ to: "/twitch/watch", search: { c: login, t: seconds }, replace: true });
  }, [login, navigate, running, seconds]);
  return Boolean(login) && (channel.isLoading || running);
}

export function TwitchVideoView({ id, startAtSeconds }: { id: string; startAtSeconds?: number }) {
  const { data, isLoading, error } = useTwitchVideoPlayback(id);
  const resume = useServerResumeRetry();
  const [seconds, setSeconds] = useState(0);
  const positionRef = useRef<number | null>(null);
  const redirecting = useRunningLiveRedirect(id, data?.video, startAtSeconds);
  return (
    <TwitchWatchLayout
      chat={data && <TwitchVodChat videoId={id} login={data.video.owner.login} seconds={seconds} />}
    >
      <TwitchWatchStage loading={isLoading || redirecting} error={error} ready={data !== undefined}>
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
              startAtMs={startAtSeconds === undefined ? null : startAtSeconds * 1000}
            />
            <TwitchWatchHeading
              title={data.video.title}
              user={data.video.owner}
              audioOnly={Boolean(data.audioUrl)}
              liveLogin={data.video.recording ? data.video.owner.login : undefined}
            />
          </>
        )}
      </TwitchWatchStage>
    </TwitchWatchLayout>
  );
}
