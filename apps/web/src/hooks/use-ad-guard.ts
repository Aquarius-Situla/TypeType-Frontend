import { type RefObject, useLayoutEffect, useRef } from "react";

// Player shortcuts that would let the viewer play, seek or mute the video hidden under the ad.
// Fullscreen and cinema mode are left alone on purpose.
const PLAYER_SHORTCUTS = new Set([
  "Space",
  "KeyK",
  "KeyJ",
  "KeyL",
  "KeyW",
  "KeyD",
  "KeyM",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Comma",
  "Period",
]);

// What the keys of the player do to the ad instead. An action left out does nothing.
export type AdKeyActions = {
  togglePause?: () => void;
  seekBy?: (seconds: number) => void;
  volumeBy?: (step: number) => void;
  toggleMute?: () => void;
};

const SEEK_STEP = 5;
const LONG_SEEK_STEP = 10;
const VOLUME_STEP = 0.1;

function pressesAdButton(event: KeyboardEvent, ad: HTMLElement): boolean {
  const target = event.target instanceof Element ? event.target : null;
  return event.code === "Space" && Boolean(target?.closest("button")) && ad.contains(target);
}

function runKey(code: string, actions: AdKeyActions): void {
  if (code === "Space" || code === "KeyK") actions.togglePause?.();
  else if (code === "ArrowLeft") actions.seekBy?.(-SEEK_STEP);
  else if (code === "ArrowRight") actions.seekBy?.(SEEK_STEP);
  else if (code === "KeyJ") actions.seekBy?.(-LONG_SEEK_STEP);
  else if (code === "KeyL") actions.seekBy?.(LONG_SEEK_STEP);
  else if (code === "ArrowUp") actions.volumeBy?.(VOLUME_STEP);
  else if (code === "ArrowDown") actions.volumeBy?.(-VOLUME_STEP);
  else if (code === "KeyM") actions.toggleMute?.();
}

// Keeps the player out of reach while an ad covers it: its controls are made inert, its shortcuts
// are swallowed and the video underneath is paused again if anything starts it. The same keys
// drive the ad itself.
export function useAdGuard(ref: RefObject<HTMLElement | null>, actions: AdKeyActions): void {
  const live = useRef(actions);
  live.current = actions;
  useLayoutEffect(() => {
    const ad = ref.current;
    if (!ad) return;
    const hidden = [...(ad.parentElement?.children ?? [])].filter(
      (child): child is HTMLElement => child !== ad && child instanceof HTMLElement && !child.inert,
    );
    for (const child of hidden) child.inert = true;
    if (!ad.contains(document.activeElement)) ad.focus({ preventScroll: true });

    const player = ad.parentElement;

    function blockPlayerShortcut(event: KeyboardEvent) {
      if (!ad || !PLAYER_SHORTCUTS.has(event.code) || pressesAdButton(event, ad)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      event.stopPropagation();
      const repeatable = event.code.startsWith("Arrow");
      if (event.type === "keydown" && (repeatable || !event.repeat))
        runKey(event.code, live.current);
    }

    function holdMainVideo(event: Event) {
      const video = event.target;
      if (video instanceof HTMLVideoElement && !ad?.contains(video)) video.pause();
    }

    window.addEventListener("keydown", blockPlayerShortcut, { capture: true });
    window.addEventListener("keyup", blockPlayerShortcut, { capture: true });
    player?.addEventListener("play", holdMainVideo, { capture: true });
    return () => {
      window.removeEventListener("keydown", blockPlayerShortcut, { capture: true });
      window.removeEventListener("keyup", blockPlayerShortcut, { capture: true });
      player?.removeEventListener("play", holdMainVideo, { capture: true });
      for (const child of hidden) child.inert = false;
    };
  }, [ref]);
}
