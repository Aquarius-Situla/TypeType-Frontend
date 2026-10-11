import { DECK_X } from "./stairs-layout";

import { MEME, type MemeFrame, memeFrame } from "./stick-show";

export const FINALE_X = DECK_X + 60;

export const FINALE = {
  recentre: [0, 3200],
  zoom: [600, 11000],
  face: [1500, 10500],
  snowOut: [6500, 12400],
} as const;

export type FinaleFrame = {
  recentre: number;
  zoom: number;
  snow: number;
  face: number;
  meme: MemeFrame;
};

const progress = ([from, to]: readonly [number, number], elapsed: number): number =>
  Math.max(0, Math.min(1, (elapsed - from) / (to - from)));

const ease = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function finaleFrame(since: number | null): FinaleFrame | null {
  if (since === null) return null;
  return {
    recentre: ease(progress(FINALE.recentre, since)),
    zoom:
      ease(progress(FINALE.zoom, since)) *
      (1 - 0.41 * ease(progress([MEME.sticksIn[0], MEME.toBug[0]], since))),
    snow: 1 - ease(progress(FINALE.snowOut, since)),
    face: ease(progress(FINALE.face, since)),
    meme: memeFrame(since),
  };
}

export function nearestTurn(from: number, to: number): number {
  return to + Math.PI * 2 * Math.round((from - to) / (Math.PI * 2));
}
