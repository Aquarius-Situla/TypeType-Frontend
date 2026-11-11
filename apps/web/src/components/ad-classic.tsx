import { useAdVideo } from "../hooks/use-ad-video";
import type { AdPlayerProps } from "../lib/ad-player";
import { m } from "../paraglide/messages.js";
import { AdFrame } from "./ad-frame";

type Props = AdPlayerProps & { src: string; cues: string; download?: string };

// A plain ad: one video, played to the end. Replayed from the sponsors page, it can be sought
// through and downloaded.
export function AdClassic({
  brand,
  src,
  cues,
  progress,
  volume,
  muted,
  soundBlocked = false,
  replay = false,
  download,
  onToggleMute,
  onVolume,
  onSoundBlocked,
  onFinish,
}: Props) {
  const video = useAdVideo({
    src,
    volume,
    muted,
    startAt: progress.time,
    onTime: (seconds) => {
      progress.time = seconds;
    },
    onEnded: onFinish,
    onSoundBlocked,
  });
  return (
    <AdFrame
      label={m.ad_label()}
      brand={brand}
      clip={cues}
      elapsed={video.elapsed}
      duration={video.duration}
      blocked={video.blocked}
      paused={video.paused}
      muted={muted}
      volume={volume}
      soundBlocked={soundBlocked}
      replay={replay}
      download={
        replay ? { href: src, name: download ?? src.split("/").pop() ?? "ad.mp4" } : undefined
      }
      onStart={video.start}
      onTogglePause={video.togglePause}
      onToggleMute={onToggleMute}
      onVolume={onVolume}
      onSeek={replay ? video.seek : undefined}
    >
      <video ref={video.ref} playsInline className="absolute inset-0 h-full w-full object-contain">
        <track kind="captions" />
      </video>
    </AdFrame>
  );
}
