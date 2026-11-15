import { Controls, ErrorDialog, Gesture, Hotkey, Time } from "@videojs/react";
import { type CSSProperties, createContext, type ReactNode, useContext } from "react";
import type { SponsorBlockSegmentItem } from "../types/api";
import type { CaptionStyles } from "../types/user";
import { VideoJsMiniControls } from "./videojs-mini-controls";
import {
  SKIN_HIDDEN_WHEN_IDLE,
  SkinFrame,
  SkinFullscreenButton,
  SkinPipButton,
  SkinPlayButton,
  SkinPoster,
  SkinVolume,
} from "./videojs-skin-controls";
import {
  SkinCaptionsButton,
  SkinCinemaButton,
  SkinTrackButton,
  SkinWebFullscreenButton,
} from "./videojs-watch-buttons";
import { VideoJsWatchSettings } from "./videojs-watch-settings";
import { VideoJsWatchTimeline } from "./videojs-watch-timeline";

export type WatchSkinOptions = {
  segments?: readonly SponsorBlockSegmentItem[];
  danmaku: boolean;
  autoplay: boolean;
  captionStyles?: CaptionStyles;
  onCaptionStylesChange?: (styles: CaptionStyles) => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

export const WatchSkinOptionsContext = createContext<WatchSkinOptions>({
  danmaku: false,
  autoplay: false,
});

const SEEK_JUMP = 10;
const PERCENT_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

// The skin of YouTube, BiliBili and NicoNico videos, built from Video.js primitives. Space, the arrows, j/l, t, w, d
// and hold to fast forward come from the shared player hotkeys; the skin only adds the Video.js native ones.
export function VideoJsWatchSkin({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const options = useContext(WatchSkinOptionsContext);
  return (
    <SkinFrame style={style} autoplay={options.autoplay}>
      {children}
      <SkinPoster />
      <Controls.Root>
        <Controls.Content
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col bg-linear-to-t from-black/80 to-transparent px-2 pt-10 pb-1.5 contrast-more:from-black/95 [@media(prefers-reduced-transparency:reduce)]:bg-black/90 ${SKIN_HIDDEN_WHEN_IDLE}`}
        >
          <div className="px-2">
            <VideoJsWatchTimeline segments={options.segments} />
          </div>
          <div data-skin-bar="" className="flex items-center gap-0.5">
            <Controls.Group className="flex min-w-0 items-center">
              <SkinTrackButton direction="previous" onClick={options.onPrevious} />
              <SkinPlayButton />
              <SkinTrackButton direction="next" onClick={options.onNext} />
              <SkinVolume />
              <Time.Group
                data-skin-secondary=""
                className="ml-1 flex items-center gap-1 text-xs tabular-nums text-white"
              >
                <Time.Value type="current" />
                <Time.Separator />
                <Time.Value type="duration" />
              </Time.Group>
            </Controls.Group>
            <div aria-hidden="true" className="flex-1" />
            <Controls.Group data-skin-secondary="" className="flex items-center">
              <SkinCaptionsButton />
              <VideoJsWatchSettings
                danmaku={options.danmaku}
                captionStyles={options.captionStyles}
                onCaptionStylesChange={options.onCaptionStylesChange}
              />
              <SkinCinemaButton />
              <SkinWebFullscreenButton />
              <SkinPipButton />
              <SkinFullscreenButton />
            </Controls.Group>
          </div>
        </Controls.Content>
        <VideoJsMiniControls />
      </Controls.Root>
      <Hotkey keys="m" action="toggleMuted" />
      <Hotkey keys="ArrowUp" action="volumeStep" />
      <Hotkey keys="ArrowDown" action="volumeStep" />
      <Hotkey keys="f" action="toggleFullscreen" />
      <Hotkey keys="i" action="togglePictureInPicture" />
      <Hotkey keys="c" action="toggleSubtitles" />
      {PERCENT_KEYS.map((key) => (
        <Hotkey key={key} keys={key} action="seekToPercent" value={Number(key) * 10} />
      ))}
      <Gesture type="tap" action="togglePaused" pointer="mouse" region="center" />
      <Gesture type="tap" action="toggleControls" pointer="touch" />
      <Gesture type="doubletap" action="seekStep" value={-SEEK_JUMP} region="left" />
      <Gesture type="doubletap" action="toggleFullscreen" region="center" />
      <Gesture type="doubletap" action="seekStep" value={SEEK_JUMP} region="right" />
      <ErrorDialog.Root>
        <ErrorDialog.Popup className="absolute inset-0 z-40 grid place-content-center gap-3 bg-black/85 p-6 text-center text-white [&:not([data-open])]:hidden">
          <ErrorDialog.Title className="text-base font-semibold" />
          <ErrorDialog.Description className="text-sm text-white/80" />
          <ErrorDialog.Close className="mx-auto cursor-pointer rounded-md bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" />
        </ErrorDialog.Popup>
      </ErrorDialog.Root>
    </SkinFrame>
  );
}
