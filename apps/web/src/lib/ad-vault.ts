import type { AdProgress } from "./ad-progress";

const KEY = "typetype-sponsors";
const TRIAL_ENDINGS = 5;

// The ad left unfinished: it resumes before the next video instead of giving way to the next ad.
export type AdPending = AdProgress & { index: number };

// Everything ad mode remembers. It stays in this browser: ads are an opt-in joke, not an account
// setting, so nothing here is sent to the server.
export type AdVault = {
  wanted: boolean;
  next: number;
  pending: AdPending | null;
  seen: string[];
  endings: number[];
  // Clips of the trial watched to their end, in any session: they can be skipped from then on.
  scenes: string[];
};

const EMPTY: AdVault = {
  wanted: false,
  next: 0,
  pending: null,
  seen: [],
  endings: [],
  scenes: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function listOf<T>(value: unknown, keep: (item: unknown) => item is T): T[] {
  return Array.isArray(value) ? value.filter(keep) : [];
}

const isString = (item: unknown): item is string => typeof item === "string";
const isCount = (item: unknown): item is number => Number.isInteger(item);

function parsePending(value: unknown): AdPending | null {
  if (!isRecord(value) || !isCount(value.index) || !isString(value.scene)) return null;
  return {
    index: value.index,
    time: typeof value.time === "number" && value.time > 0 ? value.time : 0,
    scene: value.scene,
    seen: listOf(value.seen, isString),
    waiting: value.waiting === true,
  };
}

export function parseAdVault(value: unknown): AdVault {
  if (!isRecord(value)) return EMPTY;
  return {
    wanted: value.wanted === true,
    next: isCount(value.next) ? value.next : 0,
    pending: parsePending(value.pending),
    seen: listOf(value.seen, isString),
    endings: listOf(value.endings, isCount),
    scenes: listOf(value.scenes, isString),
  };
}

export function readAdVault(): AdVault {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? parseAdVault(JSON.parse(raw)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function writeAdVault(change: (before: AdVault) => AdVault): AdVault {
  const after = change(readAdVault());
  try {
    window.localStorage.setItem(KEY, JSON.stringify(after));
  } catch {
    // Storage is unavailable (private window, quota): ad mode then lasts for this page only.
  }
  return after;
}

// Seeing the five endings of the trial is the only way out of the ads besides the setting.
export function hasPremium(vault: AdVault): boolean {
  return vault.endings.length >= TRIAL_ENDINGS;
}

export function wantAds(wanted: boolean): AdVault {
  return writeAdVault((before) => ({ ...before, wanted, pending: null }));
}

export function adIsDue(vault: AdVault): boolean {
  return vault.wanted && !hasPremium(vault);
}

export function rememberAdPending(pending: AdPending): void {
  writeAdVault((before) => ({ ...before, pending }));
}

export function rememberAdFinished(id: string, next: number): void {
  writeAdVault((before) => ({
    ...before,
    next,
    pending: null,
    seen: before.seen.includes(id) ? before.seen : [...before.seen, id],
  }));
}

export function rememberEnding(ending: number): AdVault {
  return writeAdVault((before) => ({
    ...before,
    endings: before.endings.includes(ending) ? before.endings : [...before.endings, ending],
  }));
}

export function rememberScene(scene: string): AdVault {
  return writeAdVault((before) => ({
    ...before,
    scenes: before.scenes.includes(scene) ? before.scenes : [...before.scenes, scene],
  }));
}
