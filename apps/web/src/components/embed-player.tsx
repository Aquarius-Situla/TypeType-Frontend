import { Suspense } from "react";
import { useSettings } from "../hooks/use-settings";
import { videoJsSourceFor } from "../lib/video-js-source";
import { LazyVideoJsVideoPlayer } from "./lazy-videojs-video-player";
import { LoadingMascot } from "./loading-mascot";
import { VideoPlayer } from "./video-player";
import type { VideoPlayerProps } from "./video-player-types";

type Props = VideoPlayerProps & {
  playerKey?: string | number;
  watchUrl?: string;
};

export function EmbedVideoPlayer({ playerKey, watchUrl, ...props }: Props) {
  const { settings } = useSettings();
  const videoJs = videoJsSourceFor({
    engine: settings.playerEngine,
    source: props.src,
    sabr: Boolean(props.sabrConfig),
    audioOnly: Boolean(props.audioOnly),
  });
  const overlay =
    props.title && watchUrl ? (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 text-sm text-white/90 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}
      >
        <span className="truncate">{props.title}</span>
      </a>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black group">
      {videoJs ? (
        <Suspense fallback={<LoadingMascot variant="video-landscape" surface="fill" />}>
          <LazyVideoJsVideoPlayer key={playerKey} overlay={overlay} {...props} source={videoJs} />
        </Suspense>
      ) : (
        <VideoPlayer key={playerKey} overlay={overlay} hideCinemaMode {...props} />
      )}
    </div>
  );
}
