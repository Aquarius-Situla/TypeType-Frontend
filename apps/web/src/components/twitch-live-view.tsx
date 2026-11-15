import { useEffect } from "react";
import { useTwitchChannel, useTwitchLive } from "../hooks/use-twitch";
import { useTwitchLiveRecovery } from "../hooks/use-twitch-live-recovery";
import { ApiError } from "../lib/api";
import { TwitchChat } from "./twitch-chat";
import { TwitchLiveEnded } from "./twitch-live-ended";
import { TwitchLiveFailed } from "./twitch-live-failed";
import { TwitchLiveMeta } from "./twitch-live-meta";
import { TwitchOfflineChannel } from "./twitch-offline-channel";
import { TwitchPlayer } from "./twitch-player";
import { TwitchWatchHeading } from "./twitch-watch-heading";
import { TwitchWatchStage } from "./twitch-watch-stage";

const LIVE_CHECK_MS = 60_000;

export function TwitchLiveView({ login }: { login: string }) {
  const playback = useTwitchLive(login);
  const channel = useTwitchChannel(login, LIVE_CHECK_MS);
  const recovery = useTwitchLiveRecovery(playback.refetch);
  const data = playback.data;
  const live = channel.data?.live ?? data?.channel.live;
  const ended = channel.data !== undefined && channel.data.live === undefined && data !== undefined;
  const offline = playback.error instanceof ApiError && playback.error.status === 404;
  const wentLive = offline && channel.data?.live !== undefined;
  const { refetch } = playback;
  useEffect(() => {
    if (wentLive) void refetch();
  }, [wentLive, refetch]);
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {offline ? (
        <TwitchOfflineChannel login={login} />
      ) : (
        <TwitchWatchStage
          loading={playback.isLoading}
          error={playback.error}
          ready={data !== undefined}
        >
          {data && (
            <TwitchPlayer
              target={{ c: login }}
              src={data.hlsUrl}
              live
              title={live?.title ?? login}
              retryKey={recovery.retryKey}
              enabled={!ended}
              onError={recovery.onError}
              onTimeUpdate={recovery.onPlaying}
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
            />
          )}
        </TwitchWatchStage>
      )}
      <aside className="w-full lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:w-96">
        <TwitchChat login={login} />
      </aside>
    </div>
  );
}
