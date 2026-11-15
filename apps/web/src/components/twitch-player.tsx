import { type ReactNode, useMemo, useRef } from "react";
import { usePersistentWatchPlayer } from "../hooks/use-persistent-watch-player";
import { useSettings } from "../hooks/use-settings";
import { useVolumeSync } from "../hooks/use-volume-sync";
import { proxyImage } from "../lib/proxy";
import { TWITCH_STAGE_SIZE } from "../lib/twitch-stage-size";
import { type TwitchWatchTarget, twitchStreamId } from "../lib/twitch-stream-id";
import { TwitchFullscreenChat } from "./twitch-fullscreen-chat";
import type { WatchStagePlayerProps } from "./watch-stage-player";

const noop = () => undefined;

type TwitchPlayerEvents = {
  children?: ReactNode;
  onTimeUpdate?: (positionMs: number) => void;
  onPause?: () => void;
  onSeeked?: () => void;
  onEnded?: () => void;
  onError?: () => void;
};

type Props = TwitchPlayerEvents & {
  target: TwitchWatchTarget;
  src: string;
  live: boolean;
  title: string;
  poster?: string;
  mp4?: boolean;
  startTime?: number;
  retryKey?: number;
  enabled?: boolean;
};

export function TwitchPlayer({
  target,
  src,
  live,
  title,
  poster,
  mp4 = false,
  startTime = 0,
  retryKey = 0,
  enabled = true,
  children,
  ...events
}: Props) {
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const { settings, update, settingsReady } = useSettings();
  const onVolumeChange = useVolumeSync(update.mutate, settings);
  const seekRef = useRef<((seconds: number) => void) | null>(null);
  const streamId = twitchStreamId(target);
  const chatLogin = live && "c" in target ? target.c : null;
  const playerProps = useMemo<WatchStagePlayerProps>(
    () => ({
      audioOnly: false,
      streamTitle: title,
      poster: poster ? proxyImage(poster, "card") : undefined,
      playerKey: `${src}#${retryKey}`,
      sabrRetryKey: 0,
      manifestSrc: mp4 ? { src, type: "video/mp4" } : { src, type: "application/x-mpegurl" },
      provider: "unknown",
      sabrConfig: null,
      isLive: live,
      startTime,
      settings,
      settingsReady,
      autoplay: settings.autoplayOnOpen,
      originalLocale: null,
      overlay: chatLogin ? <TwitchFullscreenChat login={chatLogin} /> : null,
      seekRef,
      ownSkin: true,
      onCaptionStylesChange: (captionStyles) => update.mutate({ captionStyles }),
      onVolumeChange,
      onTimeUpdate: (positionMs) => eventsRef.current.onTimeUpdate?.(positionMs),
      onPlay: noop,
      onPause: () => eventsRef.current.onPause?.(),
      onSeeking: noop,
      onSeeked: () => eventsRef.current.onSeeked?.(),
      onError: () => eventsRef.current.onError?.(),
      onPositionReaderChange: noop,
      onEnded: () => eventsRef.current.onEnded?.(),
    }),
    [
      chatLogin,
      title,
      poster,
      src,
      mp4,
      live,
      startTime,
      retryKey,
      settings,
      settingsReady,
      update,
      onVolumeChange,
    ],
  );
  const persistent = usePersistentWatchPlayer(streamId, playerProps, enabled);
  return (
    <div
      ref={persistent.anchorRef}
      className={`relative overflow-hidden rounded-xl bg-black ${TWITCH_STAGE_SIZE}`}
    >
      {children}
    </div>
  );
}
