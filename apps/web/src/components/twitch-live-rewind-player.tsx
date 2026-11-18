import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerResumeRetry } from "../hooks/use-server-resume-retry";
import { useTwitchVideoPlayback } from "../hooks/use-twitch";
import { useTwitchVodProgress } from "../hooks/use-twitch-vod-progress";
import { rewindRangeMs, rewindTarget } from "../lib/twitch-rewind";
import { TWITCH_STAGE_SIZE } from "../lib/twitch-stage-size";
import { useTwitchRewindStore } from "../stores/twitch-rewind-store";
import { TwitchPlayer } from "./twitch-player";

type Props = {
  login: string;
  archive: { id: string; startedAt: string };
  startSeconds: number;
  title: string;
};

// Plays the recording of the running live inside the live page. Its playlist grows with the broadcast, so playback
// never reaches an end while the channel is live; catching up with the edge returns to the live itself.
export function TwitchLiveRewindPlayer({ login, archive, startSeconds, title }: Props) {
  const navigate = useNavigate();
  const { data, error } = useTwitchVideoPlayback(archive.id);
  const resume = useServerResumeRetry();
  const seekRef = useRef<((seconds: number) => void) | null>(null);
  const positionRef = useRef<number | null>(null);
  const rangeSeconds = Math.floor(rewindRangeMs(archive.startedAt, Date.now()) / 1000);
  const progress = useTwitchVodProgress(archive.id, rangeSeconds, true);
  const startRewind = useTwitchRewindStore((state) => state.startRewind);
  const setPosition = useTwitchRewindStore((state) => state.setPosition);
  const stopRewind = useTwitchRewindStore((state) => state.stopRewind);

  const goLive = () => void navigate({ to: "/twitch/watch", search: { c: login }, replace: true });
  const leave = useRef(goLive);
  leave.current = goLive;

  useEffect(() => {
    setPosition(startSeconds * 1000);
    startRewind((seconds) => seekRef.current?.(seconds));
    return stopRewind;
  }, [setPosition, startRewind, startSeconds, stopRewind]);

  useEffect(() => {
    if (error) leave.current();
  }, [error]);

  if (!data)
    return <div className={`animate-pulse rounded-xl bg-surface-strong ${TWITCH_STAGE_SIZE}`} />;
  return (
    <TwitchPlayer
      key={resume.retryKey}
      target={{ c: login }}
      src={data.hlsUrl}
      audioSrc={data.audioUrl}
      live
      recording
      seekRef={seekRef}
      title={title}
      poster={data.video.previewUrl}
      startTime={resume.retryKey > 0 ? (positionRef.current ?? 0) : startSeconds * 1000}
      onTimeUpdate={(positionMs) => {
        positionRef.current = positionMs;
        setPosition(positionMs);
        progress.onTimeUpdate(positionMs);
        const rangeMs = rewindRangeMs(archive.startedAt, Date.now());
        if (rewindTarget(positionMs, rangeMs) === null) leave.current();
      }}
      onPause={progress.onPause}
      onSeeked={progress.onSeeked}
      onError={resume.onError}
    />
  );
}
