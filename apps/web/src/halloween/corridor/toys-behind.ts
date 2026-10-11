import { CORRIDOR } from "./corridor-config";

export type ToyKind = "doll" | "teddy" | "grungy";

export type Toy = { kind: ToyKind; x: number; distance: number };

type ToysPhase = "waiting" | "placed" | "seen" | "flicker" | "done";

export type ToysState = {
  stage: number;
  phase: ToysPhase;
  away: number;
  seenFor: number;
  since: number;
  toys: Toy[];
};

export type ToysView = { x: number; distance: number; yaw: number; speed: number; lit: boolean };

export type ToysEvent = "drop" | "flicker" | null;

export const TOYS = {
  fromDistance: 6 * CORRIDOR.segmentLength,
  untilDistance: 29 * CORRIDOR.segmentLength,
  firstAwayMs: 9000,
  nextAwayMs: 5500,
  minSpeed: 60,
  facingForward: 0.35,
  seenAngle: 0.5,
  seenReach: 1500,
  hiddenAngle: 1.3,
  followAt: 1700,
  seenHoldMs: 700,
  finalHoldMs: 1400,
  glimpseMs: 200,
  flickerMs: 950,
  goneAtMs: 470,
  wallGap: 70,
} as const;

const LAYOUT: readonly (readonly [ToyKind, number, number][])[] = [
  [["doll", 30, 780]],
  [
    ["teddy", -95, 430],
    ["doll", 55, 470],
  ],
  [
    ["grungy", -55, 165],
    ["doll", 5, 200],
    ["teddy", 60, 175],
  ],
];

export const TOYS_START: ToysState = {
  stage: 0,
  phase: "waiting",
  away: 0,
  seenFor: 0,
  since: 0,
  toys: [],
};

function offAngle(view: ToysView, toy: Toy): number {
  const angle = Math.atan2(toy.x - view.x, toy.distance - view.distance) - view.yaw;
  return Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle)));
}

export function arrange(stage: number, view: ToysView): Toy[] {
  const limit = CORRIDOR.width / 2 - TOYS.wallGap;
  const centre = Math.max(-limit + 95, Math.min(limit - 95, view.x));
  return (LAYOUT[stage - 1] ?? []).map(([kind, x, back]) => ({
    kind,
    x: centre + x,
    distance: view.distance - back,
  }));
}

function inView(view: ToysView, toys: Toy[]): boolean {
  return toys.some(
    (toy) =>
      offAngle(view, toy) < TOYS.seenAngle &&
      Math.hypot(toy.x - view.x, toy.distance - view.distance) < TOYS.seenReach,
  );
}

function allHidden(view: ToysView, toys: Toy[]): boolean {
  return toys.every((toy) => offAngle(view, toy) > TOYS.hiddenAngle);
}

export function toysCalm(distance: number): boolean {
  return distance >= TOYS.fromDistance && distance <= TOYS.untilDistance;
}

export function toysStep(
  state: ToysState,
  view: ToysView,
  calm: boolean,
  dt: number,
): { state: ToysState; event: ToysEvent } {
  const ms = dt * 1000;
  const since = state.since + ms;
  if (state.phase === "done") return { state, event: null };
  if (state.phase === "flicker") {
    if (since < TOYS.flickerMs) {
      const toys = since >= TOYS.goneAtMs ? [] : state.toys;
      return { state: { ...state, since, toys }, event: null };
    }
    return { state: { ...state, phase: "done", since, toys: [] }, event: null };
  }
  if (state.phase === "seen" || state.phase === "placed") {
    const seen = view.lit && inView(view, state.toys);
    if (state.phase === "placed" && !seen) {
      const far = state.toys.every((toy) => view.distance - toy.distance > TOYS.followAt);
      if (far && allHidden(view, state.toys))
        return { state: { ...state, since, toys: arrange(state.stage, view) }, event: null };
      return { state: { ...state, since }, event: null };
    }
    const seenFor = state.seenFor + (seen ? ms : 0);
    const hold = state.stage >= LAYOUT.length ? TOYS.finalHoldMs : TOYS.seenHoldMs;
    const glimpsed = !seen && seenFor >= TOYS.glimpseMs;
    if (seenFor < hold && !glimpsed)
      return { state: { ...state, phase: "seen", seenFor, since }, event: null };
    if (state.stage >= LAYOUT.length)
      return { state: { ...state, phase: "flicker", seenFor, since: 0 }, event: "flicker" };
    return { state: { ...state, phase: "waiting", away: 0, seenFor: 0, since }, event: null };
  }
  const walking = view.speed > TOYS.minSpeed && Math.cos(view.yaw) > TOYS.facingForward;
  const away = state.away + (calm && walking ? ms : 0);
  const need = state.stage === 0 ? TOYS.firstAwayMs : TOYS.nextAwayMs;
  if (away < need) return { state: { ...state, away, since }, event: null };
  const stage = state.stage + 1;
  const toys = arrange(stage, view);
  if (!allHidden(view, toys)) return { state: { ...state, away, since }, event: null };
  return { state: { stage, phase: "placed", away: 0, seenFor: 0, since: 0, toys }, event: "drop" };
}

export function flickerLamp(state: ToysState): number {
  if (state.phase !== "flicker") return 1;
  const pattern: readonly [number, number][] = [
    [70, 0.25],
    [140, 0],
    [250, 1],
    [310, 0],
    [430, 0.35],
    [700, 0],
    [770, 0.7],
    [880, 0],
  ];
  return pattern.find(([until]) => state.since < until)?.[1] ?? 1;
}
