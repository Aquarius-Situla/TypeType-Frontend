import "@videojs/react/video/skin.css";
import { I18nProvider } from "@videojs/react/i18n";
import { VideoPlayer, VideoSkin } from "@videojs/react/video";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import type { VideoJsSource } from "../lib/video-js-source";
import { AudioCenterToggle } from "./audio-center-toggle";
import { AudioOnlyPoster } from "./audio-only-poster";
import type { VideoPlayerProps } from "./video-player-types";
import { VideoJsLivePlayer } from "./videojs-live-player";
import { VideoJsLiveSkin } from "./videojs-live-skin";
import { VideoJsMedia } from "./videojs-media";
import { VideoJsPlaybackSpeedDefault } from "./videojs-playback-speed-default";
import { VideoJsPlaybackTools } from "./videojs-playback-tools";
import { VideoJsPlayerBridge } from "./videojs-player-bridge";
import { VideoJsPlayerMedia } from "./videojs-player-media";
import { VideoJsQualityDefault } from "./videojs-quality-default";
import { VideoJsSabrEngine } from "./videojs-sabr-engine";

export type VideoJsVideoPlayerProps = VideoPlayerProps & {
  source: VideoJsSource;
  defaultQuality?: string;
  defaultPlaybackSpeed?: number;
};

const SKIN_STYLE = {
  width: "100%",
  height: "100%",
  "--media-accent-color": "var(--color-accent)",
  "--media-border-radius": "0.75rem",
  "--media-border-color": "transparent",
} as CSSProperties;

function playerLocale(locale: string): string {
  if (locale.startsWith("zh")) return "zh-CN";
  return locale.split("-")[0] ?? "en";
}

export default function VideoJsVideoPlayer(props: VideoJsVideoPlayerProps) {
  const {
    source,
    title,
    poster,
    streamType = "on-demand",
    startTime = 0,
    autoplay = false,
  } = props;
  const { locale } = useInterfaceLocale();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const sabr = source.kind === "sabr";
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const live = streamType === "live";
  const Player = live ? VideoJsLivePlayer : VideoPlayer;
  const Skin = live ? VideoJsLiveSkin : VideoSkin;
  const { onPositionReaderChange } = props;

  useEffect(() => {
    if (sabr) return;
    onPositionReaderChange?.(() => {
      const video = videoRef.current;
      return video ? video.currentTime * 1000 : null;
    });
    return () => onPositionReaderChange?.(null);
  }, [onPositionReaderChange, sabr]);

  const positionMs = () => (videoRef.current?.currentTime ?? 0) * 1000;
  const mediaRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    setVideo(element);
  }, []);
  const mediaProps = {
    playsInline: true,
    autoPlay: autoplay,
    crossOrigin: "anonymous" as const,
    preload: "auto" as const,
    className: props.mediaClassName ?? "h-full w-full",
    onLoadedMetadata: () => {
      const element = videoRef.current;
      if (element && !sabr && !live && startTime > 0 && element.currentTime < 1)
        element.currentTime = startTime / 1000;
    },
    onTimeUpdate: () => props.onTimeUpdate?.(positionMs()),
    onPlay: () => props.onPlay?.(),
    onPause: () => props.onPause?.(),
    onSeeking: () => props.onSeeking?.(positionMs()),
    onSeeked: () => props.onSeeked?.(),
    onEnded: () => props.onEnded?.(),
    onError: () => props.onError?.(positionMs()),
  };

  return (
    <div
      ref={setRoot}
      className={`h-full w-full ${props.className ?? ""}`}
      data-player-engine="videojs"
      data-player-root=""
    >
      <I18nProvider locale={playerLocale(locale)}>
        <Player title={title} poster={poster}>
          <Skin style={SKIN_STYLE}>
            <VideoJsMedia
              source={source}
              live={live}
              startTime={startTime}
              subtitles={props.subtitles}
              thumbnailVtt={props.thumbnailVtt}
              mediaRef={mediaRef}
              mediaProps={mediaProps}
            />
            <VideoJsPlayerMedia root={root}>
              {props.overlay}
              <VideoJsPlaybackTools player={props} sabrVideo={sabr ? video : null} />
              {props.audioOnly && (
                <>
                  <AudioOnlyPoster poster={poster} title={title} media={video} />
                  <AudioCenterToggle video={sabr ? video : null} />
                </>
              )}
            </VideoJsPlayerMedia>
          </Skin>
          <VideoJsPlaybackSpeedDefault speed={props.defaultPlaybackSpeed} />
          <VideoJsQualityDefault quality={props.defaultQuality} />
          {sabr ? (
            <VideoJsSabrEngine video={video} player={props} />
          ) : (
            <VideoJsPlayerBridge
              initialVolume={props.initialVolume ?? 1}
              initialMuted={props.initialMuted ?? false}
              settingsReady={props.settingsReady ?? false}
              onVolumeChange={props.onVolumeChange}
              onSeekReady={props.onSeekReady}
            />
          )}
        </Player>
      </I18nProvider>
    </div>
  );
}
