import { Controls, ErrorDialog, Gesture, Hotkey, Time, TimeSlider } from "@videojs/react";
import type { CSSProperties, ReactNode } from "react";
import { VideoJsSettingsMenu } from "./videojs-settings-menu";
import {
  SKIN_HIDDEN_WHEN_IDLE,
  SkinFrame,
  SkinFullscreenButton,
  SkinPipButton,
  SkinPlayButton,
  SkinPoster,
  SkinVolume,
} from "./videojs-skin-controls";

const SEEK_STEP = 5;
const SEEK_JUMP = 10;

function Timeline() {
  return (
    <TimeSlider.Root className="group/slider relative flex h-5 w-full cursor-pointer touch-none items-center outline-none">
      <TimeSlider.Track className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] motion-reduce:transition-none group-data-[pointing]/slider:h-1.5">
        <TimeSlider.Buffer className="absolute inset-y-0 left-0 w-(--media-slider-buffer) bg-white/40" />
        <TimeSlider.Fill className="absolute inset-y-0 left-0 w-(--media-slider-fill) bg-(--media-accent-color,white)" />
      </TimeSlider.Track>
      <TimeSlider.Thumb className="absolute left-(--media-slider-fill) size-3 -translate-x-1/2 rounded-full bg-white opacity-0 outline-none transition-opacity motion-reduce:transition-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white/70 group-data-[pointing]/slider:opacity-100 group-data-[dragging]/slider:opacity-100" />
      <TimeSlider.Preview className="pointer-events-none absolute bottom-full left-(--media-slider-pointer) mb-2 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 text-xs tabular-nums opacity-0 group-data-[pointing]/slider:opacity-100">
        <TimeSlider.Value type="pointer" />
      </TimeSlider.Preview>
    </TimeSlider.Root>
  );
}

export function VideoJsVodSkin({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <SkinFrame style={style}>
      {children}
      <SkinPoster />
      <Controls.Root>
        <Controls.Content
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col bg-linear-to-t from-black/80 to-transparent px-2 pt-8 pb-2 contrast-more:from-black/95 [@media(prefers-reduced-transparency:reduce)]:bg-black/90 ${SKIN_HIDDEN_WHEN_IDLE}`}
        >
          <div className="px-2">
            <Timeline />
          </div>
          <div className="flex items-center gap-1">
            <Controls.Group className="flex min-w-0 items-center">
              <SkinPlayButton />
              <SkinVolume />
              <Time.Group className="ml-1 flex items-center gap-1 text-xs tabular-nums text-white">
                <Time.Value type="current" />
                <Time.Separator />
                <Time.Value type="duration" />
              </Time.Group>
            </Controls.Group>
            <div aria-hidden="true" className="flex-1" />
            <Controls.Group className="flex items-center">
              <VideoJsSettingsMenu speed />
              <SkinPipButton />
              <SkinFullscreenButton />
            </Controls.Group>
          </div>
        </Controls.Content>
      </Controls.Root>
      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="k" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <Hotkey keys="ArrowUp" action="volumeStep" />
      <Hotkey keys="ArrowDown" action="volumeStep" />
      <Hotkey keys="ArrowLeft" action="seekStep" value={-SEEK_STEP} />
      <Hotkey keys="ArrowRight" action="seekStep" value={SEEK_STEP} />
      <Hotkey keys="j" action="seekStep" value={-SEEK_JUMP} />
      <Hotkey keys="l" action="seekStep" value={SEEK_JUMP} />
      <Hotkey keys="f" action="toggleFullscreen" />
      <Hotkey keys="i" action="togglePictureInPicture" />
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
