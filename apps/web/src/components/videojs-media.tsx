import { Video } from "@videojs/react/video";
import { lazy, type ReactNode } from "react";
import { useWebVttUrl } from "../hooks/use-web-vtt-url";
import { normalizeTrackOnLoad } from "../lib/normalize-text-track";
import type { Provider } from "../lib/provider";
import type { VideoJsSource } from "../lib/video-js-source";
import { loadDashMedia, loadHlsMedia } from "../lib/videojs-media-loaders";
import { buildSafeSubtitleTracks } from "./subtitle-track-utils";
import type { VideoPlayerProps } from "./video-player-types";
import type { VideoJsMediaProps } from "./videojs-media-props";
import { SabrVideo } from "./videojs-sabr-video";

const HlsMedia = lazy(loadHlsMedia);
const DashMedia = lazy(loadDashMedia);

type Props = {
  source: VideoJsSource;
  provider?: Provider;
  live: boolean;
  // Only the Twitch player offers the latency switch; other lives keep the segment counts their own servers need.
  liveLatency?: boolean;
  startTime: number;
  subtitles: VideoPlayerProps["subtitles"];
  thumbnailVtt?: string;
  chaptersVtt?: string;
  mediaRef: (element: HTMLVideoElement | null) => void;
  mediaProps: VideoJsMediaProps;
};

function Tracks({
  subtitles,
  thumbnailVtt,
  chaptersVtt,
}: Pick<Props, "subtitles" | "thumbnailVtt" | "chaptersVtt">): ReactNode {
  const thumbnails = useWebVttUrl(thumbnailVtt);
  const chapters = useWebVttUrl(chaptersVtt);
  return (
    <>
      {buildSafeSubtitleTracks(subtitles).map((track) => (
        <track
          key={track.key}
          ref={normalizeTrackOnLoad}
          kind="subtitles"
          src={track.src}
          label={track.label}
          srcLang={track.lang}
        />
      ))}
      {thumbnails && <track kind="metadata" label="thumbnails" src={thumbnails} default />}
      {chapters && <track kind="chapters" src={chapters} default />}
    </>
  );
}

export function VideoJsMedia({
  source,
  provider,
  live,
  liveLatency = false,
  startTime,
  subtitles,
  thumbnailVtt,
  chaptersVtt,
  mediaRef,
  mediaProps,
}: Props) {
  const tracks = (
    <Tracks subtitles={subtitles} thumbnailVtt={thumbnailVtt} chaptersVtt={chaptersVtt} />
  );
  switch (source.kind) {
    case "sabr":
      return (
        <SabrVideo ref={mediaRef} {...mediaProps} autoPlay={false}>
          {tracks}
        </SabrVideo>
      );
    case "hls":
      return (
        <HlsMedia
          src={source.src}
          type={source.type}
          live={live}
          liveLatency={liveLatency}
          startTime={startTime}
          mediaRef={mediaRef}
          mediaProps={mediaProps}
        >
          {tracks}
        </HlsMedia>
      );
    case "dash":
      return (
        <DashMedia src={source.src} provider={provider} mediaRef={mediaRef} mediaProps={mediaProps}>
          {tracks}
        </DashMedia>
      );
    default:
      return (
        <Video ref={mediaRef} {...mediaProps} src={source.src}>
          {tracks}
        </Video>
      );
  }
}
