import { type ReactNode, useMemo, useRef, useState } from "react";
import { usePersistentWatchPlayer } from "../hooks/use-persistent-watch-player";
import { useSettings } from "../hooks/use-settings";
import { useVolumeSync } from "../hooks/use-volume-sync";
import { proxyImage } from "../lib/proxy";
import { TWITCH_STAGE_SIZE } from "../lib/twitch-stage-size";
import { type TwitchWatchTarget, twitchStreamId } from "../lib/twitch-stream-id";
import { useTwitchAudioOnlyStore } from "../stores/twitch-audio-only-store";
import { TwitchAdBreak } from "./twitch-ad-break";
import { TwitchChat } from "./twitch-chat";
import { TwitchFullscreenChat } from "./twitch-fullscreen-chat";
import { TwitchVodChatOverlay } from "./twitch-vod-chat-overlay";
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
  // The audio rendition of the same broadcast, played instead of src when audio only is on.
  audioSrc?: string;
  live: boolean;
  title: string;
  poster?: string;
  mp4?: boolean;
  startTime?: number;
  retryKey?: number;
  enabled?: boolean;
  chaptersVtt?: string;
  // The channel of a past broadcast, whose chat is replayed over the fullscreen video.
  vodChatLogin?: string;
};

export function TwitchPlayer({
  target,
  src: videoSrc,
  audioSrc,
  live,
  title,
  poster,
  mp4 = false,
  startTime = 0,
  retryKey = 0,
  enabled = true,
  chaptersVtt,
  vodChatLogin,
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
  const vodId = target.v;
  const audioChosen = useTwitchAudioOnlyStore((state) => state.audioOnly);
  const audioOnly = audioChosen && Boolean(audioSrc) && !mp4;
  const src = audioOnly && audioSrc ? audioSrc : videoSrc;
  // Switching between audio and video mounts a new player: a past broadcast goes on where it was.
  const positionMs = useRef<number | null>(null);
  const [switched, setSwitched] = useState({ audioOnly, atMs: null as number | null });
  if (switched.audioOnly !== audioOnly) setSwitched({ audioOnly, atMs: positionMs.current });
  const resumeAt = live ? startTime : (switched.atMs ?? startTime);
  const playerProps = useMemo<WatchStagePlayerProps>(
    () => ({
      audioOnly,
      streamTitle: title,
      poster: poster ? proxyImage(poster, "card") : undefined,
      playerKey: `${src}#${retryKey}`,
      sabrRetryKey: 0,
      manifestSrc: mp4 ? { src, type: "video/mp4" } : { src, type: "application/x-mpegurl" },
      provider: "unknown",
      sabrConfig: null,
      isLive: live,
      startTime: resumeAt,
      chaptersVtt,
      settings,
      settingsReady,
      autoplay: settings.autoplayOnOpen,
      originalLocale: null,
      overlay: chatLogin ? (
        <>
          <TwitchAdBreak login={chatLogin} />
          <TwitchFullscreenChat>
            <TwitchChat login={chatLogin} overlay />
          </TwitchFullscreenChat>
        </>
      ) : vodChatLogin && vodId ? (
        <TwitchFullscreenChat>
          <TwitchVodChatOverlay videoId={vodId} login={vodChatLogin} />
        </TwitchFullscreenChat>
      ) : null,
      seekRef,
      ownSkin: true,
      onCaptionStylesChange: (captionStyles) => update.mutate({ captionStyles }),
      onVolumeChange,
      onTimeUpdate: (at) => {
        positionMs.current = at;
        eventsRef.current.onTimeUpdate?.(at);
      },
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
      vodChatLogin,
      vodId,
      title,
      poster,
      src,
      mp4,
      live,
      audioOnly,
      resumeAt,
      chaptersVtt,
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
