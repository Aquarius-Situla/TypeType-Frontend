import { Controls, Gesture, Hotkey, LiveButton } from "@videojs/react";
import { type CSSProperties, type ReactNode, useContext, useState } from "react";
import { PlayerBarSlotContext } from "../hooks/use-player-bar-slot";
import { m } from "../paraglide/messages.js";
import { useTwitchRewindStore } from "../stores/twitch-rewind-store";
import { useReturnToLive, VideoJsLiveRewind } from "./videojs-live-rewind";
import { VideoJsMiniControls } from "./videojs-mini-controls";
import { SkinRemoteButtons } from "./videojs-remote-buttons";
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
import { SkinCinemaButton, SkinWebFullscreenButton } from "./videojs-watch-buttons";
import { WatchSkinOptionsContext } from "./videojs-watch-skin";

const LIVE_BADGE_CLASS =
  "ml-1 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold tracking-wider text-white uppercase outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white";

function LiveBadge() {
  const rewinding = useTwitchRewindStore((state) => state.rewinding);
  const returnToLive = useReturnToLive();
  if (rewinding)
    return (
      <button type="button" onClick={returnToLive} className={LIVE_BADGE_CLASS}>
        <span aria-hidden="true" className="size-2 rounded-full bg-white/40" />
        {m.ui_live()}
      </button>
    );
  return (
    <LiveButton
      className={LIVE_BADGE_CLASS}
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

export function VideoJsLiveSkin({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const [barSlot, setBarSlot] = useState<HTMLElement | null>(null);
  const { flat } = useContext(WatchSkinOptionsContext);
  return (
    <SkinFrame style={style}>
      <PlayerBarSlotContext.Provider value={barSlot}>{children}</PlayerBarSlotContext.Provider>
      <SkinPoster />
      <Controls.Root>
        <Controls.Content
          data-skin-bottom=""
          className={`absolute inset-x-0 bottom-0 z-20 flex items-center gap-1 bg-linear-to-t from-black/80 to-transparent px-2 pt-8 pb-2 contrast-more:from-black/95 [@media(prefers-reduced-transparency:reduce)]:bg-black/90 ${SKIN_HIDDEN_WHEN_IDLE}`}
        >
          <Controls.Group className="flex min-w-0 items-center">
            <span data-skin-transport="" className="flex items-center">
              <SkinPlayButton />
            </span>
            <SkinVolume pill={false} />
            <LiveBadge />
          </Controls.Group>
          <div className="flex min-w-0 flex-1 items-center">{flat && <VideoJsLiveRewind />}</div>
          <Controls.Group data-skin-right="" className="flex items-center">
            <span ref={setBarSlot} className="flex items-center" />
            <VideoJsSettingsMenu speed={false} latency={flat} />
            <SkinCinemaButton />
            <SkinWebFullscreenButton />
            <SkinRemoteButtons />
            <SkinPipButton />
            <SkinFullscreenButton />
          </Controls.Group>
        </Controls.Content>
        <VideoJsMiniControls live />
      </Controls.Root>
      <Hotkey keys="Space" action="togglePaused" />
      <Hotkey keys="k" action="togglePaused" />
      <Hotkey target="document" keys="m" action="toggleMuted" />
      <Hotkey keys="ArrowUp" action="volumeStep" />
      <Hotkey keys="ArrowDown" action="volumeStep" />
      <Hotkey target="document" keys="f" action="toggleFullscreen" />
      <Hotkey target="document" keys="i" action="togglePictureInPicture" />
      <Gesture type="tap" action="togglePaused" pointer="mouse" region="center" />
      <Gesture type="tap" action="toggleControls" pointer="touch" />
      <Gesture type="doubletap" action="toggleFullscreen" region="center" />
    </SkinFrame>
  );
}
