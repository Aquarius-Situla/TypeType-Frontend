import type { useMediaPlayer } from "./vidstack";

export function clearVidstackEndedState(
  player: ReturnType<typeof useMediaPlayer> | null | undefined,
  media?: HTMLMediaElement | null,
): boolean {
  if (!player) return false;
  const playerAny = player as unknown as {
    $state?: {
      ended?: { set: (val: boolean) => void; (): boolean };
      realCurrentTime?: { set: (val: number) => void };
      paused?: { set: (val: boolean) => void; (): boolean };
    };
    state?: {
      ended?: boolean | { set: (val: boolean) => void; (): boolean };
      realCurrentTime?: number | { set: (val: number) => void };
      paused?: boolean;
    };
    el?: HTMLElement | null;
  };

  let cleared = false;
  const stateSignal = playerAny.$state;
  if (stateSignal?.ended?.set) {
    const isEnded =
      typeof stateSignal.ended === "function" ? stateSignal.ended() : Boolean(stateSignal.ended);
    if (isEnded) {
      stateSignal.ended.set(false);
      cleared = true;
    }
  }

  const rootEl = playerAny.el;
  if (rootEl?.hasAttribute("data-ended")) {
    rootEl.removeAttribute("data-ended");
    cleared = true;
  }

  if (cleared && media && Number.isFinite(media.currentTime)) {
    stateSignal?.realCurrentTime?.set?.(media.currentTime);
  }

  return cleared;
}
