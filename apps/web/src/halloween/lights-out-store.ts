import { create } from "zustand";
import { BANK_COUNT } from "./light-banks";

export type LightsOutPhase =
  | "idle"
  | "loading"
  | "humming"
  | "cutting"
  | "dark"
  | "corridor"
  | "restoring";

type Flicker = {
  bank: number;
  startedAt: number;
  durationMs: number;
};

type LightsOutState = {
  phase: LightsOutPhase;
  visitedCorridor: boolean;
  bankOffAt: Array<number | null>;
  flicker: Flicker | null;
  lampOn: boolean;
  lampChangedAt: number;
  restoreStartedAt: number;
  setPhase: (phase: LightsOutPhase) => void;
  switchOffBank: (bank: number, at: number) => void;
  flickerBank: (bank: number, at: number, durationMs: number) => void;
  setLamp: (on: boolean, at: number) => void;
  beginRestore: (at: number) => void;
  reset: () => void;
};

const INITIAL = {
  phase: "idle" as const,
  visitedCorridor: false,
  bankOffAt: Array.from({ length: BANK_COUNT }, () => null),
  flicker: null,
  lampOn: false,
  lampChangedAt: 0,
  restoreStartedAt: 0,
};

export const useLightsOutStore = create<LightsOutState>()((set) => ({
  ...INITIAL,
  setPhase: (phase) =>
    set((state) => ({ phase, visitedCorridor: state.visitedCorridor || phase === "corridor" })),
  switchOffBank: (bank, at) =>
    set((state) => ({ bankOffAt: state.bankOffAt.map((value, i) => (i === bank ? at : value)) })),
  flickerBank: (bank, at, durationMs) => set({ flicker: { bank, startedAt: at, durationMs } }),
  setLamp: (on, at) => set({ lampOn: on, lampChangedAt: at }),
  beginRestore: (at) => set({ phase: "restoring", restoreStartedAt: at, lampOn: false }),
  reset: () => set({ ...INITIAL, bankOffAt: Array.from({ length: BANK_COUNT }, () => null) }),
}));
