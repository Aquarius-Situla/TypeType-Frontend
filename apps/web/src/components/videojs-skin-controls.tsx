import {
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
import { useVideoJsWheelVolume } from "../hooks/use-videojs-wheel-volume";
import { BAR_BUTTON, BAR_PILL } from "../lib/videojs-menu-classes";
import { VideoJsLoadingMascot } from "./videojs-loading-mascot";

export const SKIN_HIDDEN_WHEN_IDLE =
  "transition-[opacity,translate] duration-100 ease-out will-change-[opacity,translate] motion-reduce:transition-none [&:not([data-visible]):not(:has(:focus-visible))]:pointer-events-none [&:not([data-visible]):not(:has(:focus-visible))]:translate-y-1 [&:not([data-visible]):not(:has(:focus-visible))]:opacity-0 [&:not([data-visible]):not(:has(:focus-visible))]:duration-300";

const ICON = "size-5";

export function SkinPlayButton({ className = BAR_BUTTON }: { className?: string }) {
  return (
    <PlayButton
      className={className}
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

export function SkinVolume({ pill = true }: { pill?: boolean }) {
  const wheelVolume = useVideoJsWheelVolume();
  return (
    <div
      ref={wheelVolume}
      className={
        pill
          ? `group/volume ${BAR_PILL} transition-[padding] duration-200 ease-out focus-within:pr-3 hover:pr-3 motion-reduce:transition-none`
          : "flex items-center"
      }
    >
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
      <VolumeSlider.Root
        data-skin-volume-slider=""
        className={
          pill
            ? "relative flex h-10 w-0 cursor-pointer touch-none items-center overflow-hidden opacity-0 outline-none transition-[width,opacity] duration-200 ease-out group-focus-within/volume:w-16 group-focus-within/volume:opacity-100 group-hover/volume:w-16 group-hover/volume:opacity-100 motion-reduce:transition-none"
            : "relative mx-1 hidden h-9 w-20 cursor-pointer touch-none items-center outline-none sm:flex"
        }
      >
        <div className="relative mx-1.5 flex h-full flex-1 items-center">
          <VolumeSlider.Track
            className={`relative w-full rounded-full ${pill ? "h-0.5 bg-white/25" : "h-1 bg-white/30"}`}
          >
            <VolumeSlider.Fill className="absolute inset-y-0 left-0 w-(--media-slider-fill) rounded-full bg-white" />
          </VolumeSlider.Track>
          <VolumeSlider.Thumb className="absolute left-(--media-slider-fill) size-3 -translate-x-1/2 rounded-full bg-white outline-none focus-visible:ring-2 focus-visible:ring-white/70" />
        </div>
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

type SkinFrameProps = { children: ReactNode; style?: CSSProperties; autoplay?: boolean };

export function SkinFrame({ children, style, autoplay = false }: SkinFrameProps) {
  return (
    <Container
      style={style}
      className="relative block overflow-hidden rounded-(--media-border-radius) bg-black text-white outline-none [&_img]:rounded-[inherit] [&_video]:rounded-[inherit] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-inset fullscreen:rounded-none"
    >
      {children}
      <VideoJsLoadingMascot autoplay={autoplay} />
      <Title
        className={`media-title pointer-events-none absolute inset-x-0 top-0 z-10 truncate bg-linear-to-b from-black/70 to-transparent px-4 pt-3 pb-8 contrast-more:from-black/95 [@media(prefers-reduced-transparency:reduce)]:bg-black/90 text-sm font-medium text-white ${SKIN_HIDDEN_WHEN_IDLE}`}
      />
      <StatusAnnouncer />
    </Container>
  );
}

export function SkinPoster() {
  return (
    <Poster.Root className="pointer-events-none absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none [&:not([data-visible])]:opacity-0">
      <Poster.Image className="h-full w-full object-cover" />
    </Poster.Root>
  );
}
