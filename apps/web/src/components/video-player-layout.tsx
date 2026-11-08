import { useCompactPlayer } from "../hooks/use-compact-player";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { PLAYBACK_RATES } from "../lib/playback-rates";
import { playerLayoutTranslations } from "../lib/player-layout-translations";
import {
  DefaultAudioLayout,
  DefaultVideoLayout,
  defaultLayoutIcons,
  Time,
  useMediaState,
} from "../lib/vidstack";
import { AudioPlayButton } from "./audio-play-button";
import { AudioSeekButton } from "./audio-seek-button";
import { AudioTimeSlider } from "./audio-time-slider";
import { AudioTrackSelector } from "./audio-track-selector";
import { CinemaModeControl } from "./cinema-mode-control";
import { CompactPlayerControls } from "./compact-player-controls";
import { DanmakuSelector } from "./danmaku-selector";
import { FormatSelector } from "./format-selector";
import { LoopToggle } from "./loop-toggle";
import { PlayerTrackButton } from "./player-track-button";
import { PlayerVolumeControl, PlayerVolumeSlider } from "./player-volume-control";
import { QualitySelector } from "./quality-selector";
import { SabrCurrentTime } from "./sabr-current-time";
import { ShortsPlayerLayout } from "./shorts-player-layout";
import { UnifiedTimeSlider } from "./unified-time-slider";
import { WebFullscreenControl } from "./web-fullscreen-control";

type Props = {
  audioOnly?: boolean;
  hideCinemaMode?: boolean;
  layoutMode?: "default" | "shorts";
  audioUsesVideoProvider?: boolean;
  sabr?: boolean;
  sabrVideo?: HTMLVideoElement | null;
  seeking?: boolean;
  thumbnailVtt?: string;
  originalAudioLocale?: string | null;
  onPreviousVideo?: () => void;
  onNextVideo?: () => void;
};

export function VideoPlayerLayout({
  audioOnly = false,
  hideCinemaMode = false,
  layoutMode = "default",
  audioUsesVideoProvider = false,
  sabr = false,
  sabrVideo = null,
  seeking = false,
  thumbnailVtt,
  originalAudioLocale,
  onPreviousVideo,
  onNextVideo,
}: Props) {
  const { locale } = useInterfaceLocale();
  const compact = useCompactPlayer();
  const fullscreen = useMediaState("fullscreen");
  const translations = playerLayoutTranslations(locale);

  if (compact && !fullscreen) return <CompactPlayerControls video={sabrVideo} seeking={seeking} />;

  if (layoutMode === "shorts") {
    return (
      <ShortsPlayerLayout
        sabr={sabr}
        video={sabrVideo}
        seeking={seeking}
        originalAudioLocale={originalAudioLocale}
      />
    );
  }

  if (audioOnly) {
    const timePair = (
      <div className="typetype-audio-time-pair">
        {sabr ? (
          <SabrCurrentTime transitioning={seeking} video={sabrVideo} />
        ) : (
          <Time type="current" />
        )}
        <span>/</span>
        <Time type="duration" />
      </div>
    );
    const backwardButton = (
      <AudioSeekButton direction="backward" disabled={seeking} video={sabrVideo} />
    );
    const forwardButton = (
      <AudioSeekButton direction="forward" disabled={seeking} video={sabrVideo} />
    );
    const timeSlider = <AudioTimeSlider seeking={seeking} video={sabrVideo} />;
    if (audioUsesVideoProvider) {
      return (
        <DefaultVideoLayout
          className="typetype-adaptive-audio-layout"
          icons={defaultLayoutIcons}
          playbackRates={PLAYBACK_RATES}
          smallLayoutWhen={false}
          translations={translations}
          slots={{
            currentTime: null,
            timeDivider: null,
            endTime: timePair,
            timeSlider,
            beforePlayButton: backwardButton,
            playButton: <AudioPlayButton video={sabrVideo} />,
            afterPlayButton: forwardButton,
            beforeCaptionButton: (
              <PlayerTrackButton direction="previous" onClick={onPreviousVideo} />
            ),
            afterCaptionButton: <PlayerTrackButton direction="next" onClick={onNextVideo} />,
            beforeSettingsMenu: <PlayerVolumeControl />,
            volumeSlider: <PlayerVolumeSlider />,
            fullscreenButton: null,
            pipButton: null,
            title: null,
            chapterTitle: null,
          }}
        />
      );
    }
    return (
      <DefaultAudioLayout
        icons={defaultLayoutIcons}
        playbackRates={PLAYBACK_RATES}
        smallLayoutWhen={false}
        translations={translations}
        slots={{
          endTime: timePair,
          timeSlider,
          seekBackwardButton: backwardButton,
          playButton: <AudioPlayButton video={sabrVideo} />,
          seekForwardButton: forwardButton,
          beforeCaptionButton: <PlayerTrackButton direction="previous" onClick={onPreviousVideo} />,
          afterCaptionButton: <PlayerTrackButton direction="next" onClick={onNextVideo} />,
          beforeSettingsMenu: <PlayerVolumeControl />,
          volumeSlider: <PlayerVolumeSlider />,
        }}
      />
    );
  }

  return (
    <DefaultVideoLayout
      icons={defaultLayoutIcons}
      playbackRates={PLAYBACK_RATES}
      thumbnails={thumbnailVtt}
      smallLayoutWhen={({ height }) => height < 380}
      translations={translations}
      slots={{
        currentTime: sabr ? (
          <SabrCurrentTime transitioning={seeking} video={sabrVideo} />
        ) : undefined,
        timeSlider: (
          <UnifiedTimeSlider
            sabr={sabr}
            seeking={sabr ? seeking : undefined}
            thumbnails={thumbnailVtt}
            video={sabr ? sabrVideo : null}
          />
        ),
        settingsMenuItemsStart: (
          <>
            <AudioTrackSelector originalLocale={originalAudioLocale} sabr={sabr} />
            <QualitySelector />
            <FormatSelector />
            <DanmakuSelector />
          </>
        ),
        settingsMenuItemsEnd: <LoopToggle />,
        beforePlayButton: <PlayerTrackButton direction="previous" onClick={onPreviousVideo} />,
        afterPlayButton: <PlayerTrackButton direction="next" onClick={onNextVideo} />,
        beforeFullscreenButton: (
          <>
            <PlayerVolumeControl />
            {!hideCinemaMode && <CinemaModeControl />}
            {!hideCinemaMode && <WebFullscreenControl />}
          </>
        ),
        volumeSlider: <PlayerVolumeSlider />,
      }}
    />
  );
}
