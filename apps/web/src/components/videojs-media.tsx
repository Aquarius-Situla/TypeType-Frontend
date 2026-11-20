import type { DashAdapter } from "@videojs/react/media/dash-video";
import { DashVideo } from "@videojs/react/media/dash-video";
import { type HlsJsAdapter, HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { Video } from "@videojs/react/video";
import { type ReactNode, useCallback, useMemo, useRef, type VideoHTMLAttributes } from "react";
import { useLiveBreakNotice } from "../hooks/use-live-break-notice";
import { useLowLatencySettle } from "../hooks/use-low-latency-settle";
import { usePassingDecodeError } from "../hooks/use-passing-decode-error";
import { useWebVttUrl } from "../hooks/use-web-vtt-url";
import { attachBilibiliDash } from "../lib/dash-bilibili-behaviour";
import { registerDashPlayer } from "../lib/dash-player-registration";
import { buildDashStreamingSettings } from "../lib/dash-streaming-settings";
import { HLS_BUFFER_LIMITS } from "../lib/hls-buffer-limits";
import { liveLatencyConfig } from "../lib/live-latency";
import { normalizeTrackOnLoad } from "../lib/normalize-text-track";
import { HLS_OUTAGE_LOAD_POLICIES } from "../lib/playback-outage-policy";
import type { Provider } from "../lib/provider";
import type { VideoJsSource } from "../lib/video-js-source";
import { useLiveLatencyStore } from "../stores/live-latency-store";
import { buildSafeSubtitleTracks } from "./subtitle-track-utils";
import type { VideoPlayerProps } from "./video-player-types";
import { SabrVideo } from "./videojs-sabr-video";

type MediaProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "preload"> & {
  preload?: "auto" | "metadata" | "none";
};

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
  mediaProps: MediaProps;
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
  const startRef = useRef(startTime);
  startRef.current = startTime;
  const lowLatency = useLiveLatencyStore((state) => state.lowLatency);
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const hlsAdapter = useRef<HlsJsAdapter | null>(null);
  const hlsVideoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoElement.current = element;
      mediaRef(element);
    },
    [mediaRef],
  );
  const onHlsAdapter = useCallback((adapter: HlsJsAdapter | null) => {
    hlsAdapter.current = adapter;
  }, []);
  usePassingDecodeError(source.kind === "hls", videoElement, hlsAdapter);
  useLiveBreakNotice(
    source.kind === "hls" && live && Boolean(liveLatency),
    videoElement,
    hlsAdapter,
  );
  useLowLatencySettle(
    source.kind === "hls" && live && liveLatency && lowLatency,
    source.src,
    videoElement,
    hlsAdapter,
  );
  const hlsSource = useMemo(
    () => ({
      src: source.src,
      type: source.type ?? "application/x-mpegurl",
      engine: {
        hlsJs: {
          ...HLS_BUFFER_LIMITS,
          ...HLS_OUTAGE_LOAD_POLICIES,
          ...(live && liveLatency ? liveLatencyConfig(lowLatency) : {}),
          startPosition: live ? -1 : startRef.current / 1000,
          startLevel: 0,
        },
      },
    }),
    [source.src, source.type, live, liveLatency, lowLatency],
  );
  const dashSource = useMemo(
    () => ({
      src: source.src,
      engine: { dashJs: { streaming: buildDashStreamingSettings(provider) } },
    }),
    [source.src, provider],
  );
  const onDashAdapter = useCallback(
    (adapter: DashAdapter | null) => {
      registerDashPlayer(adapter?.engine ?? null);
      if (adapter && provider === "bilibili") attachBilibiliDash(adapter.engine);
    },
    [provider],
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
        <HlsJsVideo ref={hlsVideoRef} mediaRef={onHlsAdapter} {...mediaProps} source={hlsSource}>
          {tracks}
        </HlsJsVideo>
      );
    case "dash":
      return (
        <DashVideo ref={mediaRef} mediaRef={onDashAdapter} {...mediaProps} source={dashSource}>
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
