import {
  BufferingIndicator,
  Container,
  Controls,
  ErrorDialog,
  FullscreenButton,
  Gesture,
  Hotkey,
  LiveButton,
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
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { BAR_BUTTON } from "../lib/videojs-menu-classes";
import { m } from "../paraglide/messages.js";
import { VideoJsLiveQualityMenu } from "./videojs-live-quality-menu";

const HIDDEN_WHEN_IDLE =
  "transition-opacity duration-200 [&:not([data-visible]):not(:has(:focus-visible))]:pointer-events-none [&:not([data-visible]):not(:has(:focus-visible))]:opacity-0";

function VolumeControl() {
  return (
    <div className="group/volume flex items-center">
      <MuteButton
        className={BAR_BUTTON}
        render={(props, state) => (
          <button {...props} type="button">
            {state.muted || state.volumeLevel === "off" ? (
              <VolumeX className="size-5" aria-hidden="true" />
            ) : state.volumeLevel === "low" ? (
              <Volume1 className="size-5" aria-hidden="true" />
            ) : (
              <Volume2 className="size-5" aria-hidden="true" />
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

function LiveBadge() {
  return (
    <LiveButton
      className="ml-1 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold tracking-wider text-white uppercase outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white"
      render={(props, state) => (
        <button {...props} type="button">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${state.liveEdge ? "bg-red-500" : "bg-white/40"}`}
          />
          {m.ui_live()}
        </button>
      )}
    />
  );
}

function ControlBar() {
  return (
    <Controls.Root>
      <Controls.Content
        className={`absolute inset-x-0 bottom-0 z-20 flex items-center gap-1 bg-linear-to-t from-black/80 to-transparent px-2 pt-8 pb-2 ${HIDDEN_WHEN_IDLE}`}
      >
        <Controls.Group className="flex min-w-0 items-center">
          <PlayButton
            className={BAR_BUTTON}
            render={(props, state) => (
              <button {...props} type="button">
                {state.paused ? (
                  <Play className="size-5 fill-current" aria-hidden="true" />
                ) : (
                  <Pause className="size-5 fill-current" aria-hidden="true" />
                )}
              </button>
            )}
          />
          <VolumeControl />
          <LiveBadge />
        </Controls.Group>
        <div aria-hidden="true" className="flex-1" />
        <Controls.Group className="flex items-center">
          <VideoJsLiveQualityMenu />
          <PiPButton
            className={BAR_BUTTON}
            render={(props) => (
              <button {...props} type="button">
                <PictureInPicture2 className="size-5" aria-hidden="true" />
              </button>
            )}
          />
          <FullscreenButton
            className={BAR_BUTTON}
            render={(props, state) => (
              <button {...props} type="button">
                {state.fullscreen ? (
                  <Minimize className="size-5" aria-hidden="true" />
                ) : (
                  <Maximize className="size-5" aria-hidden="true" />
                )}
              </button>
            )}
          />
        </Controls.Group>
      </Controls.Content>
    </Controls.Root>
  );
}

export function VideoJsLiveSkin({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Container
      style={style}
      className="relative block overflow-hidden rounded-(--media-border-radius) bg-black text-white fullscreen:rounded-none"
    >
      {children}
      <Poster.Root className="pointer-events-none absolute inset-0 transition-opacity duration-300 [&:not([data-visible])]:opacity-0">
        <Poster.Image className="h-full w-full object-cover" />
      </Poster.Root>
      <BufferingIndicator className="pointer-events-none absolute inset-0 z-10 hidden place-content-center data-[visible]:grid">
        <LoaderCircle className="size-10 animate-spin text-white" aria-hidden="true" />
      </BufferingIndicator>
      <Title
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 truncate bg-linear-to-b from-black/70 to-transparent px-4 pt-3 pb-8 text-sm font-medium text-white ${HIDDEN_WHEN_IDLE}`}
      />
      <ControlBar />
      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="k" action="togglePaused" />
      <Hotkey keys="m" action="toggleMuted" />
      <Hotkey keys="ArrowUp" action="volumeStep" />
      <Hotkey keys="ArrowDown" action="volumeStep" />
      <Hotkey keys="f" action="toggleFullscreen" />
      <Hotkey keys="i" action="togglePictureInPicture" />
      <Gesture type="tap" action="togglePaused" pointer="mouse" region="center" />
      <Gesture type="tap" action="toggleControls" pointer="touch" />
      <Gesture type="doubletap" action="toggleFullscreen" region="center" />
      <StatusAnnouncer />
      <ErrorDialog.Root>
        <ErrorDialog.Popup className="absolute inset-0 z-40 grid place-content-center gap-3 bg-black/85 p-6 text-center text-white [&:not([data-open])]:hidden">
          <ErrorDialog.Title className="text-base font-semibold" />
          <ErrorDialog.Description className="text-sm text-white/80" />
          <ErrorDialog.Close className="mx-auto cursor-pointer rounded-md bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25" />
        </ErrorDialog.Popup>
      </ErrorDialog.Root>
    </Container>
  );
}
