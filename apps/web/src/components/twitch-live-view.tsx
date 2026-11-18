import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTwitchChannel, useTwitchLive } from "../hooks/use-twitch";
import { useTwitchLiveArchiveProgress } from "../hooks/use-twitch-live-archive-progress";
import { useTwitchLiveRecovery } from "../hooks/use-twitch-live-recovery";
import { ApiError } from "../lib/api";
import { rewindRangeMs, rewindTarget } from "../lib/twitch-rewind";
import { useTwitchRewindStore } from "../stores/twitch-rewind-store";
import { TwitchChat } from "./twitch-chat";
import { TwitchLiveEnded } from "./twitch-live-ended";
import { TwitchLiveFailed } from "./twitch-live-failed";
import { TwitchLiveMeta } from "./twitch-live-meta";
import { TwitchLiveRewindPlayer } from "./twitch-live-rewind-player";
import { TwitchOfflineChannel } from "./twitch-offline-channel";
import { TwitchPlayer } from "./twitch-player";
import { TwitchWatchHeading } from "./twitch-watch-heading";
import { TwitchWatchLayout } from "./twitch-watch-layout";
import { TwitchWatchStage } from "./twitch-watch-stage";

const LIVE_CHECK_MS = 60_000;

export function TwitchLiveView({
  login,
  rewindSeconds,
}: {
  login: string;
  rewindSeconds?: number;
}) {
  const playback = useTwitchLive(login);
  const channel = useTwitchChannel(login, LIVE_CHECK_MS);
  const recovery = useTwitchLiveRecovery(playback.refetch);
  const data = playback.data;
  const live = channel.data?.live ?? data?.channel.live;
  const ended = channel.data !== undefined && channel.data.live === undefined && data !== undefined;
  const watchArchive = useTwitchLiveArchiveProgress(live?.archive);
  const archiveId = live?.archive?.id;
  const archiveStart = live?.archive?.startedAt;
  const setChannel = useTwitchRewindStore((state) => state.setChannel);
  useEffect(() => {
    setChannel(
      login,
      archiveId && archiveStart ? { id: archiveId, startedAt: archiveStart } : null,
    );
  }, [archiveId, archiveStart, login, setChannel]);
  useEffect(() => () => setChannel(null, null), [setChannel]);
  const navigate = useNavigate();
  const archive = archiveId && archiveStart ? { id: archiveId, startedAt: archiveStart } : null;
  const rewinding =
    rewindSeconds !== undefined &&
    archive !== null &&
    !ended &&
    rewindTarget(rewindSeconds * 1000, rewindRangeMs(archive.startedAt, Date.now())) !== null;
  const invalidRewind = rewindSeconds !== undefined && data !== undefined && !rewinding && !ended;
  useEffect(() => {
    if (invalidRewind) void navigate({ to: "/twitch/watch", search: { c: login }, replace: true });
  }, [invalidRewind, login, navigate]);
  // Once the broadcast is over its recording is an ordinary past broadcast: playback carries on there.
  const finishedArchive = ended && rewindSeconds !== undefined ? archiveId : undefined;
  useEffect(() => {
    if (!finishedArchive) return;
    const positionMs = useTwitchRewindStore.getState().positionMs;
    const seconds = Math.floor(positionMs / 1000) || rewindSeconds || 0;
    void navigate({
      to: "/twitch/watch",
      search: { v: finishedArchive, t: seconds },
      replace: true,
    });
  }, [finishedArchive, navigate, rewindSeconds]);
  const offline = playback.error instanceof ApiError && playback.error.status === 404;
  const wentLive = offline && channel.data?.live !== undefined;
  const { refetch } = playback;
  useEffect(() => {
    if (wentLive) void refetch();
  }, [wentLive, refetch]);
  return (
    <TwitchWatchLayout chat={<TwitchChat login={login} />}>
      {offline ? (
        <TwitchOfflineChannel login={login} />
      ) : (
        <TwitchWatchStage
          loading={playback.isLoading}
          error={playback.error}
          ready={data !== undefined}
        >
          {data && rewinding && archive && (
            <TwitchLiveRewindPlayer
              key={archive.id}
              login={login}
              archive={archive}
              startSeconds={rewindSeconds}
              title={live?.title ?? login}
            />
          )}
          {data && !rewinding && (
            <TwitchPlayer
              target={{ c: login }}
              src={data.hlsUrl}
              audioSrc={data.audioUrl}
              live
              title={live?.title ?? login}
              retryKey={recovery.retryKey}
              enabled={!ended}
              onError={recovery.onError}
              onTimeUpdate={() => {
                recovery.onPlaying();
                watchArchive();
              }}
            >
              {ended && <TwitchLiveEnded login={login} />}
              {!ended && recovery.failed && <TwitchLiveFailed onRetry={recovery.retry} />}
            </TwitchPlayer>
          )}
          {data && (
            <TwitchWatchHeading
              title={live?.title ?? login}
              user={data.channel}
              meta={live ? <TwitchLiveMeta stream={live} /> : undefined}
              audioOnly={Boolean(data.audioUrl)}
              liveLogin={rewinding ? login : undefined}
            />
          )}
        </TwitchWatchStage>
      )}
    </TwitchWatchLayout>
  );
}
