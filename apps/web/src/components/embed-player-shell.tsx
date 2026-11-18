import { useRef } from "react";
import { usePlayerError } from "../hooks/use-player-error";
import {
  resolvePlayerRetryStartTime,
  usePlayerErrorResume,
} from "../hooks/use-player-error-resume";
import { useSabrPlaybackConfig } from "../hooks/use-sabr-playback-config";
import { useSettings } from "../hooks/use-settings";
import { useVolumeSync } from "../hooks/use-volume-sync";
import { useWatchVttAssets } from "../hooks/use-watch-layout-assets";
import { useWatchSponsorBlock } from "../hooks/use-watch-sponsorblock";
import { getOriginalAudioLocale } from "../lib/audio-track";
import { resolveEmbedAutoplay } from "../lib/embed-playback";
import { toPublicWatchParam } from "../lib/watch-url";
import type { VideoStream } from "../types/stream";
import { EmbedError, playbackFailedMessage } from "./embed-error";
import { EmbedVideoPlayer } from "./embed-player";

type Props = {
  stream: VideoStream;
  sourceUrl: string;
  startTime: number;
  autoplay: boolean;
  sessionEnabled: boolean;
};

export function EmbedPlayerShell({
  stream,
  sourceUrl,
  startTime,
  autoplay,
  sessionEnabled,
}: Props) {
  const { settings, settingsReady, update } = useSettings({
    forceAnonymous: !sessionEnabled,
  });
  const isLive = stream.streamType === "live_stream" || stream.streamType === "audio_live_stream";
  const player = usePlayerError(stream, isLive);
  const handleVolumeChange = useVolumeSync(update.mutate, settings);

  const positionRef = useRef(0);
  const playbackIntentRef = useRef(autoplay);
  const prevStreamId = useRef(stream.id);
  if (prevStreamId.current !== stream.id) {
    prevStreamId.current = stream.id;
    playbackIntentRef.current = autoplay;
  }

  const { retryStartTime, handlePlayerError } = usePlayerErrorResume(
    stream.id,
    stream.duration,
    positionRef,
    player.handleError,
  );

  const effectiveStartTime = resolvePlayerRetryStartTime(retryStartTime, startTime);
  const effectiveAutoplay = resolveEmbedAutoplay(
    player.retryKey,
    playbackIntentRef.current,
    autoplay,
  );

  const watchUrl = `/watch?v=${encodeURIComponent(toPublicWatchParam(sourceUrl))}`;

  const sponsor = useWatchSponsorBlock(stream, settings);
  const autoSkipSponsorBlock = sessionEnabled && settings.sponsorBlockMode !== "disabled";

  const { thumbnailVtt, chaptersVtt } = useWatchVttAssets(
    stream,
    sponsor.segments,
    settings.sponsorBlockShowChapters,
  );

  const sabrConfig = useSabrPlaybackConfig(
    stream,
    player.sabrEnabled,
    settings.defaultQuality,
    settings.defaultAudioLanguage,
    settings.preferOriginalLanguage,
    false,
  );

  const playerKey = [
    stream.id,
    player.retryKey,
    player.sabrEnabled ? "sabr" : "std",
    thumbnailVtt ? "thumbs" : "no-thumbs",
    chaptersVtt ? "chapters" : "no-chapters",
  ].join(":");

  if (player.playerFailed) {
    return <EmbedError message={playbackFailedMessage()} onRetry={player.reset} />;
  }

  return (
    <EmbedVideoPlayer
      playerKey={playerKey}
      src={player.manifestSrc}
      sabrConfig={sabrConfig}
      audioOnly={false}
      title={stream.title}
      poster={stream.thumbnail}
      subtitles={stream.subtitles}
      startTime={effectiveStartTime}
      autoplay={effectiveAutoplay}
      settingsReady={settingsReady}
      streamType={isLive ? "live" : "on-demand"}
      chaptersVtt={chaptersVtt}
      thumbnailVtt={thumbnailVtt}
      originalAudioLocale={getOriginalAudioLocale(stream)}
      initialVolume={settings.volume}
      initialMuted={settings.muted}
      sponsorBlockSegments={sponsor.segments}
      autoSkipSponsorBlockSegments={sessionEnabled ? sponsor.autoSkipSegments : []}
      manualSkipSponsorBlockSegments={
        sessionEnabled ? sponsor.manualSkipSegments : sponsor.segments
      }
      autoSkipSponsorBlock={autoSkipSponsorBlock}
      muteSponsorBlockInsteadOfSkip={settings.sponsorBlockMuteInsteadOfSkip}
      showCurrentSponsorBlockSegment={settings.sponsorBlockShowCurrentSegment}
      captionStyles={settings.captionStyles}
      onCaptionStylesChange={(captionStyles) => update.mutate({ captionStyles })}
      onVolumeChange={handleVolumeChange}
      onTimeUpdate={(positionMs) => {
        positionRef.current = positionMs;
      }}
      onPlay={() => {
        playbackIntentRef.current = true;
        player.clearFailed();
      }}
      onPause={() => {
        playbackIntentRef.current = false;
      }}
      onError={handlePlayerError}
      watchUrl={watchUrl}
    />
  );
}
