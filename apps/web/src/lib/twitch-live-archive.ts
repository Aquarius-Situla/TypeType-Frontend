// The live plays a few seconds behind the broadcaster and the recording starts a few seconds after the stream:
// saving the position a little earlier makes the past broadcast resume just before what was seen, never after.
const BEHIND_MS = 15_000;

export function liveArchivePositionMs(archiveStartedAt: string, now: number): number | null {
  const start = Date.parse(archiveStartedAt);
  if (!Number.isFinite(start)) return null;
  return Math.max(0, now - start - BEHIND_MS);
}
