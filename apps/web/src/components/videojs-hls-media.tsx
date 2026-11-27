import { type HlsJsAdapter, HlsJsVideo } from "@videojs/react/media/hlsjs-video";
import { type ReactNode, useCallback, useMemo, useRef } from "react";
import { useLiveBreakNotice } from "../hooks/use-live-break-notice";
import { useLowLatencySettle } from "../hooks/use-low-latency-settle";
import { usePassingDecodeError } from "../hooks/use-passing-decode-error";
import { HLS_BUFFER_LIMITS } from "../lib/hls-buffer-limits";
import { liveLatencyConfig } from "../lib/live-latency";
import { HLS_OUTAGE_LOAD_POLICIES } from "../lib/playback-outage-policy";
import { useLiveLatencyStore } from "../stores/live-latency-store";
import type { VideoJsMediaElementProps } from "./videojs-media-props";

type Props = VideoJsMediaElementProps & {
  src: string;
  type?: string;
  live: boolean;
  liveLatency: boolean;
  startTime: number;
  children: ReactNode;
};

export default function VideoJsHlsMedia({
  src,
  type,
  live,
  liveLatency,
  startTime,
  mediaRef,
  mediaProps,
  children,
}: Props) {
  const startRef = useRef(startTime);
  startRef.current = startTime;
  const lowLatency = useLiveLatencyStore((state) => state.lowLatency);
  const videoElement = useRef<HTMLVideoElement | null>(null);
  const hlsAdapter = useRef<HlsJsAdapter | null>(null);
  const videoRef = useCallback(
    (element: HTMLVideoElement | null) => {
      videoElement.current = element;
      mediaRef(element);
    },
    [mediaRef],
  );
  const onAdapter = useCallback((adapter: HlsJsAdapter | null) => {
    hlsAdapter.current = adapter;
  }, []);
  usePassingDecodeError(true, videoElement, hlsAdapter);
  useLiveBreakNotice(live && liveLatency, videoElement, hlsAdapter);
  useLowLatencySettle(live && liveLatency && lowLatency, src, videoElement, hlsAdapter);
  const source = useMemo(
    () => ({
      src,
      type: type ?? "application/x-mpegurl",
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
    [src, type, live, liveLatency, lowLatency],
  );
  return (
    <HlsJsVideo ref={videoRef} mediaRef={onAdapter} {...mediaProps} source={source}>
      {children}
    </HlsJsVideo>
  );
}
