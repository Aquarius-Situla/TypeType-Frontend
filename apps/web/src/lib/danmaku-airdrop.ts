import type { BulletCommentItem } from "../types/api";

export type DanmakuAirdrop = { key: string; seconds: number };

const CLOCK_PATTERN = /(?<![\d:])(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)(?![\d:])/;
const AIRDROP_OFFER_MS = 6000;
const MIN_JUMP_SECONDS = 5;

export function danmakuAirdropSeconds(text: string): number | null {
  const match = CLOCK_PATTERN.exec(text);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  return hours * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

export function currentDanmakuAirdrop(
  comments: BulletCommentItem[],
  positionMs: number,
  durationSeconds: number,
): DanmakuAirdrop | null {
  if (!Number.isFinite(durationSeconds)) return null;
  const positionSeconds = positionMs / 1000;
  let latest: DanmakuAirdrop | null = null;
  let latestAt = Number.NEGATIVE_INFINITY;
  for (const [index, comment] of comments.entries()) {
    const age = positionMs - comment.durationMs;
    if (age < 0 || age >= AIRDROP_OFFER_MS || comment.durationMs <= latestAt) continue;
    const seconds = danmakuAirdropSeconds(comment.text);
    if (seconds === null || seconds >= durationSeconds) continue;
    if (Math.abs(seconds - positionSeconds) < MIN_JUMP_SECONDS) continue;
    latest = { key: `${index}:${seconds}`, seconds };
    latestAt = comment.durationMs;
  }
  return latest;
}
