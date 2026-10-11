import { PEEK_MS } from "./corridor-story";

export const WATCHER_SCENE = {
  tilt: [1500, 2700],
  tvOffAt: 3200,
  tvOff: [90, 350, 900, 1600],
  turn: [6800, 10800],
  eyes: [11800, 14600],
  slam: 17000,
  holdSilence: 3500,
  release: 11000,
} as const;

export const NECK_CRACKS = [6900, 7250, 7750, 8450, 9350] as const;
export const NECK_SNAP = 10700;

export function cracksDue(noticedAt: number, now: number, played: number): number {
  return NECK_CRACKS.filter((at) => now - noticedAt >= at).length - played;
}

export type WatcherFrame = {
  idle: boolean;
  tvOff: number | null;
  tilt: number;
  turn: number;
  eyes: number;
  slam: boolean;
};

const UNAWARE: WatcherFrame = {
  idle: true,
  tvOff: null,
  tilt: 0,
  turn: 0,
  eyes: 0,
  slam: false,
};

const progress = ([from, to]: readonly [number, number], elapsed: number): number =>
  Math.max(0, Math.min(1, (elapsed - from) / (to - from)));

const ease = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function watcherFrame(noticedAt: number | null, now: number): WatcherFrame {
  if (noticedAt === null) return UNAWARE;
  const elapsed = now - noticedAt;
  const sinceTvOff = elapsed - WATCHER_SCENE.tvOffAt;
  return {
    idle: false,
    tvOff: sinceTvOff < 0 ? null : WATCHER_SCENE.tvOff.filter((at) => sinceTvOff >= at).length,
    tilt: ease(progress(WATCHER_SCENE.tilt, elapsed)),
    turn: ease(progress(WATCHER_SCENE.turn, elapsed)),
    eyes: ease(progress(WATCHER_SCENE.eyes, elapsed)),
    slam: elapsed >= WATCHER_SCENE.slam,
  };
}

export function sceneFocus(
  peekingSince: number | null,
  noticedAt: number | null,
  now: number,
): number {
  if (noticedAt !== null) {
    const after = now - noticedAt - WATCHER_SCENE.slam - WATCHER_SCENE.holdSilence;
    if (after <= 0) return 1;
    return Math.max(0, 1 - after / WATCHER_SCENE.release);
  }
  if (peekingSince === null) return 0;
  return Math.min(1, (now - peekingSince) / PEEK_MS);
}

export function slamJolt(since: number): { shake: number; recoil: number } {
  if (since < 0 || since > 1600) return { shake: 0, recoil: 0 };
  const shake = 11 * Math.exp(-since / 170);
  const recoil = 9 * (since < 70 ? since / 70 : Math.exp(-(since - 70) / 420));
  return { shake, recoil };
}
