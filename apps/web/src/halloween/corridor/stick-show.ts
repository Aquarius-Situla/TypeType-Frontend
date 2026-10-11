import { STICK_BUG, STICK_BUG_RICKROLL, STICK_FACE, type Stick } from "./stick-drawings";

export const MEME = {
  sticksIn: [12800, 15600],
  faceOut: [16000, 16900],
  toBug: [17000, 19100],
  stickbug: { start: 16000, length: 10700 },
  rickroll: { start: 28750, length: 10650 },
} as const;

export type MemeVideo = "stickbug" | "rickroll";

export const CLIP_FADE: Record<MemeVideo, readonly [number, number]> = {
  stickbug: [3250, 3550],
  rickroll: [150, 450],
};

export type MemeFrame = {
  face: number;
  sticks: { shape: Stick; opacity: number }[];
  track: { name: MemeVideo; since: number } | null;
};

export const STICK_COUNT = Math.max(STICK_FACE.length, STICK_BUG.length, STICK_BUG_RICKROLL.length);

const progress = ([from, to]: readonly [number, number], t: number): number =>
  Math.max(0, Math.min(1, (t - from) / (to - from)));
const ease = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * t);
const jitter = (seed: number): number => {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const pick = (drawing: readonly Stick[], i: number): Stick =>
  drawing[i % drawing.length] ?? [0.5, 0.5, 0.5, 0.5];

function fly(a: Stick, b: Stick, t: number): Stick {
  const centre = (s: Stick): [number, number] => [(s[0] + s[2]) / 2, (s[1] + s[3]) / 2];
  const angle = (s: Stick): number => Math.atan2(s[3] - s[1], s[2] - s[0]);
  const length = (s: Stick): number => Math.hypot(s[2] - s[0], s[3] - s[1]);
  const [ax, ay] = centre(a);
  const [bx, by] = centre(b);
  let turn = angle(b) - angle(a);
  turn -= Math.PI * Math.round(turn / Math.PI);
  const x = ax + (bx - ax) * t;
  const y = ay + (by - ay) * t;
  const r = angle(a) + turn * t;
  const half = (length(a) + (length(b) - length(a)) * t) / 2;
  return [
    x - Math.cos(r) * half,
    y - Math.sin(r) * half,
    x + Math.cos(r) * half,
    y + Math.sin(r) * half,
  ];
}

function staggered(span: readonly [number, number], since: number, i: number): number {
  const delay = jitter(i + 11) * 0.35;
  return ease(Math.max(0, Math.min(1, (progress(span, since) - delay) / (1 - delay))));
}

function drawn(s: Stick, t: number): Stick {
  return [s[0], s[1], s[0] + (s[2] - s[0]) * t, s[1] + (s[3] - s[1]) * t];
}

function track(name: MemeVideo, since: number): MemeFrame["track"] {
  const { start, length } = MEME[name];
  return since >= start && since < start + length ? { name, since: since - start } : null;
}

export function memeFrame(since: number): MemeFrame {
  const face = 1 - ease(progress(MEME.faceOut, since));
  const playing = track("stickbug", since) ?? track("rickroll", since);
  if (since < MEME.sticksIn[0]) return { face, sticks: [], track: null };
  if (playing?.name === "rickroll") {
    const sticks = Array.from({ length: STICK_COUNT }, (_, i) => ({
      shape: pick(STICK_BUG_RICKROLL, i),
      opacity: 1,
    }));
    return { face, sticks, track: playing };
  }
  if (since >= MEME.stickbug.start + MEME.stickbug.length) return { face, sticks: [], track: null };
  const step = (MEME.sticksIn[1] - MEME.sticksIn[0]) / STICK_COUNT;
  const sticks = Array.from({ length: STICK_COUNT }, (_, i) => {
    const grow = ease(Math.max(0, Math.min(1, (since - MEME.sticksIn[0] - step * i) / 450)));
    const own = drawn(pick(STICK_FACE, i), grow);
    const shape = fly(own, pick(STICK_BUG, i), staggered(MEME.toBug, since, i));
    return { shape, opacity: grow > 0 ? 1 : 0 };
  });
  return { face, sticks, track: playing };
}
