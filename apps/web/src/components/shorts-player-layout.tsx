import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { PLAYBACK_RATES } from "../lib/playback-rates";
import { playerLayoutTranslations } from "../lib/player-layout-translations";
import { DefaultVideoLayout, defaultLayoutIcons } from "../lib/vidstack";
import { AudioTrackSelector } from "./audio-track-selector";
import { FormatSelector } from "./format-selector";
import { PlayerVolumeControl } from "./player-volume-control";
import { QualitySelector } from "./quality-selector";
import { UnifiedTimeSlider } from "./unified-time-slider";

type Props = {
  sabr: boolean;
  video: HTMLVideoElement | null;
  seeking: boolean;
  originalAudioLocale?: string | null;
};

export function ShortsPlayerLayout({ sabr, video, seeking, originalAudioLocale }: Props) {
  const { locale } = useInterfaceLocale();

  return (
    <DefaultVideoLayout
      className="typetype-shorts-layout"
      icons={defaultLayoutIcons}
      playbackRates={PLAYBACK_RATES}
      smallLayoutWhen={false}
      translations={playerLayoutTranslations(locale)}
      noModal
      menuContainer="body"
      menuGroup="bottom"
      slots={{
        timeSlider: (
          <UnifiedTimeSlider
            sabr={sabr}
            seeking={sabr ? seeking : undefined}
            video={sabr ? video : null}
          />
        ),
        settingsMenuItemsStart: (
          <>
            <AudioTrackSelector originalLocale={originalAudioLocale} sabr={sabr} />
            <QualitySelector />
            <FormatSelector />
          </>
        ),
        beforeFullscreenButton: <PlayerVolumeControl />,
        pipButton: null,
        title: null,
        chapterTitle: null,
      }}
    />
  );
}
