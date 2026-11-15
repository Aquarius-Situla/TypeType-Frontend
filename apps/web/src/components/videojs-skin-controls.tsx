import {
  BufferingIndicator,
  Container,
  FullscreenButton,
  MuteButton,
  PiPButton,
  PlayButton,
  Poster,
  StatusAnnouncer,
  Title,
  VolumeSlider,
} from "@videojs/react";
import {
  LoaderCircle,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";

export const SKIN_HIDDEN_WHEN_IDLE =
  "transition-opacity duration-200 [&:not([data-visible]):not(:has(:focus-visible))]:pointer-events-none [&:not([data-visible]):not(:has(:focus-visible))]:opacity-0";

const ICON = "size-5";

export function SkinPlayButton() {
  return (
    <PlayButton
      className={BAR_BUTTON}
      render={(props, state) => (
        <button {...props} type="button">
          {state.ended ? (
            <RotateCcw className={ICON} aria-hidden="true" />
          ) : state.paused ? (
            <Play className={`${ICON} fill-current`} aria-hidden="true" />
          ) : (
            <Pause className={`${ICON} fill-current`} aria-hidden="true" />
          )}
        </button>
      )}
    />
  );
}

export function SkinVolume() {
  return (
    <div className="flex items-center">
      <MuteButton
        className={BAR_BUTTON}
        render={(props, state) => (
          <button {...props} type="button">
            {state.muted || state.volumeLevel === "off" ? (
              <VolumeX className={ICON} aria-hidden="true" />
            ) : state.volumeLevel === "low" ? (
              <Volume1 className={ICON} aria-hidden="true" />
            ) : (
              <Volume2 className={ICON} aria-hidden="true" />
            )}
          </button>
        )}
      />
      <VolumeSlider.Root className="relative mx-1 hidden h-9 w-20 cursor-pointer items-center outline-none sm:flex">
        <VolumeSlider.Track className="relative h-1 w-full rounded-full bg-white/30">
          <VolumeSlider.Fill className="absolute inset-y-0 left-0 w-(--media-slider-fill) rounded-full bg-white" />
        </VolumeSlider.Track>
        <VolumeSlider.Thumb className="absolute left-(--media-slider-fill) size-3 -translate-x-1/2 rounded-full bg-white outline-none focus-visible:ring-2 focus-visible:ring-white/70" />
      </VolumeSlider.Root>
    </div>
  );
}

export function SkinPipButton() {
  return (
    <PiPButton
      className={BAR_BUTTON}
      render={(props) => (
        <button {...props} type="button">
          <PictureInPicture2 className={ICON} aria-hidden="true" />
        </button>
      )}
    />
  );
}

export function SkinFullscreenButton() {
  return (
    <FullscreenButton
      className={BAR_BUTTON}
      render={(props, state) => (
        <button {...props} type="button">
          {state.fullscreen ? (
            <Minimize className={ICON} aria-hidden="true" />
          ) : (
            <Maximize className={ICON} aria-hidden="true" />
          )}
        </button>
      )}
    />
  );
}

export function SkinFrame({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <Container
      style={style}
      className="relative block overflow-hidden rounded-(--media-border-radius) bg-black text-white fullscreen:rounded-none"
    >
      {children}
      <BufferingIndicator className="pointer-events-none absolute inset-0 z-10 hidden place-content-center data-[visible]:grid">
        <LoaderCircle className="size-10 animate-spin text-white" aria-hidden="true" />
      </BufferingIndicator>
      <Title
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 truncate bg-linear-to-b from-black/70 to-transparent px-4 pt-3 pb-8 text-sm font-medium text-white ${SKIN_HIDDEN_WHEN_IDLE}`}
      />
      <StatusAnnouncer />
    </Container>
  );
}

export function SkinPoster() {
  return (
    <Poster.Root className="pointer-events-none absolute inset-0 transition-opacity duration-300 [&:not([data-visible])]:opacity-0">
      <Poster.Image className="h-full w-full object-cover" />
    </Poster.Root>
  );
}
