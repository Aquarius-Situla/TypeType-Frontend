import { DashVideo } from "@videojs/react/media/dash-video";
import { HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { Video } from "@videojs/react/video";
import type { ReactNode, VideoHTMLAttributes } from "react";
import { useWebVttUrl } from "../hooks/use-web-vtt-url";
import type { VideoJsSource } from "../lib/video-js-source";
import { buildSafeSubtitleTracks } from "./subtitle-track-utils";
import type { VideoPlayerProps } from "./video-player-types";
import { SabrVideo } from "./videojs-sabr-video";

type MediaProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "preload"> & {
  preload?: "auto" | "metadata" | "none";
};

type Props = {
  source: VideoJsSource;
  live: boolean;
  startTime: number;
  subtitles: VideoPlayerProps["subtitles"];
  thumbnailVtt?: string;
  mediaRef: (element: HTMLVideoElement | null) => void;
  mediaProps: MediaProps;
};

function Tracks({ subtitles, thumbnailVtt }: Pick<Props, "subtitles" | "thumbnailVtt">): ReactNode {
  const thumbnails = useWebVttUrl(thumbnailVtt);
  return (
    <>
      {buildSafeSubtitleTracks(subtitles).map((track) => (
        <track
          key={track.key}
          kind="subtitles"
          src={track.src}
          label={track.label}
          srcLang={track.lang}
        />
      ))}
      {thumbnails && <track kind="metadata" label="thumbnails" src={thumbnails} default />}
    </>
  );
}

export function VideoJsMedia({
  source,
  live,
  startTime,
  subtitles,
  thumbnailVtt,
  mediaRef,
  mediaProps,
}: Props) {
  const tracks = <Tracks subtitles={subtitles} thumbnailVtt={thumbnailVtt} />;
  switch (source.kind) {
    case "sabr":
      return (
        <SabrVideo ref={mediaRef} {...mediaProps} autoPlay={false}>
          {tracks}
        </SabrVideo>
      );
    case "hls":
      return (
        <HlsJsVideo
          ref={mediaRef}
          {...mediaProps}
          source={{
            src: source.src,
            type: source.type ?? "application/x-mpegurl",
            engine: { hlsJs: { startPosition: live ? -1 : startTime / 1000 } },
          }}
        >
          {tracks}
        </HlsJsVideo>
      );
    case "dash":
      return (
        <DashVideo ref={mediaRef} {...mediaProps} source={{ src: source.src }}>
          {tracks}
        </DashVideo>
      );
    default:
      return (
        <Video ref={mediaRef} {...mediaProps} src={source.src}>
          {tracks}
        </Video>
      );
  }
}
