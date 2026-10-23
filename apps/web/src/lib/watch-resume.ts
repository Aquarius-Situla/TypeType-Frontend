import type { ProgressItem } from "../types/user";

type WatchResumeInput = {
  authenticated: boolean;
  progressPending: boolean;
  savedPositionMs?: number;
  serverPositionSeconds?: number;
  durationSeconds: number;
};

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
  if (input.authenticated && input.progressPending) return null;

  const savedPositionMs = input.savedPositionMs ?? 0;
  const serverPositionMs = (input.serverPositionSeconds ?? 0) * 1000;
  const resumeMs = savedPositionMs > 0 ? savedPositionMs : serverPositionMs;
  const durationMs = input.durationSeconds * 1000;
  return resumeMs >= 5000 && resumeMs < durationMs * 0.95 ? resumeMs : 0;
}
