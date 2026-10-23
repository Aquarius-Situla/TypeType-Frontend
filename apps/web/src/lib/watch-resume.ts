import type { ProgressItem } from "../types/user";

export type WatchResumeInput = {
  authenticated: boolean;
  progressPending: boolean;
  savedPositionMs?: number;
  serverPositionSeconds?: number;
  durationSeconds: number;
};

export type SaveReason =
  | "beforeunload"
  | "interval"
  | "pagehide"
  | "pause"
  | "seeked"
  | "threshold"
  | "unmount"
  | "visibility";

export type ProgressPersistenceDecision =
  | { shouldSave: false }
  | {
      shouldSave: true;
      positionMs: number;
      keepalive: boolean;
      isReset: boolean;
      isBackwardJump: boolean;
    };

function isNearVideoEnd(positionMs: number, durationMs: number): boolean {
  if (durationMs <= 0) return false;
  const remainingMs = durationMs - positionMs;
  if (remainingMs <= 15000) return true;
  if (positionMs >= durationMs * 0.95 && remainingMs <= 180000) return true;
  return false;
}

export function evaluateProgressPersistence(input: {
  positionMs: number;
  lastSavedPositionMs: number;
  maxPositionSeenMs: number;
  durationMs: number;
  reason: SaveReason;
}): ProgressPersistenceDecision {
  const { positionMs, lastSavedPositionMs, maxPositionSeenMs, durationMs, reason } = input;
  if (!Number.isFinite(positionMs)) {
    return { shouldSave: false };
  }
  if (reason === "seeked" && positionMs < 5000 && maxPositionSeenMs >= 5000) {
    return {
      shouldSave: true,
      positionMs: 0,
      keepalive: false,
      isReset: true,
      isBackwardJump: false,
    };
  }
  if (positionMs <= 0) {
    return { shouldSave: false };
  }
  if (isNearVideoEnd(positionMs, durationMs)) {
    return { shouldSave: false };
  }
  const isBackwardJump = lastSavedPositionMs - positionMs > 3000;
  if (reason !== "seeked" && !isBackwardJump && positionMs < lastSavedPositionMs) {
    return { shouldSave: false };
  }
  const keepalive =
    reason === "pagehide" ||
    reason === "beforeunload" ||
    reason === "unmount" ||
    reason === "visibility";
  return {
    shouldSave: true,
    positionMs,
    keepalive,
    isReset: false,
    isBackwardJump,
  };
}

export function reconcileProgressItem(
  local: ProgressItem | null | undefined,
  server: ProgressItem | null | undefined,
): { chosen: ProgressItem; shouldSyncServer: boolean; shouldSyncLocal: boolean } {
  if (!server && !local) {
    return {
      chosen: { videoUrl: "", position: 0, updatedAt: 0 },
      shouldSyncServer: false,
      shouldSyncLocal: false,
    };
  }
  if (!server) {
    const chosen = local ?? { videoUrl: "", position: 0, updatedAt: 0 };
    return { chosen, shouldSyncServer: false, shouldSyncLocal: false };
  }
  if (!local) {
    return { chosen: server, shouldSyncServer: false, shouldSyncLocal: server.position > 0 };
  }
  if (local.updatedAt > server.updatedAt && local.position > 0) {
    return { chosen: local, shouldSyncServer: true, shouldSyncLocal: false };
  }
  return { chosen: server, shouldSyncServer: false, shouldSyncLocal: server.position > 0 };
}

export function shouldWaitForWatchProgress(
  authenticated: boolean,
  pending: boolean,
  fetching: boolean,
  hasData: boolean,
): boolean {
  return authenticated && !hasData && (pending || fetching);
}

export function resolveWatchStartTime(input: WatchResumeInput): number | null {
  const savedPositionMs = input.savedPositionMs ?? 0;
  const durationMs = input.durationSeconds * 1000;
  if (savedPositionMs > 0) {
    return savedPositionMs >= 5000 && !isNearVideoEnd(savedPositionMs, durationMs)
      ? savedPositionMs
      : 0;
  }
  if (input.authenticated && input.progressPending) return null;

  const serverPositionMs = (input.serverPositionSeconds ?? 0) * 1000;
  return serverPositionMs >= 5000 && !isNearVideoEnd(serverPositionMs, durationMs)
    ? serverPositionMs
    : 0;
}
