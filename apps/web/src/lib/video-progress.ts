import type { VideoStream } from "../types/stream";
import type { ProgressItem } from "../types/user";
import { toPublicWatchParam, toWatchSourceUrl } from "./watch-url";

const PROGRESS_BATCH_SIZE = 200;
const PROGRESS_CHUNK_SIZE = 30;

export function videoProgressUrl(stream: Pick<VideoStream, "id">): string {
  return toWatchSourceUrl(toPublicWatchParam(stream.id));
}

export function progressBatches(videoUrls: string[]): string[][] {
  const urls = [...new Set(videoUrls.filter(Boolean))];
  const batches: string[][] = [];
  for (let index = 0; index < urls.length; index += PROGRESS_BATCH_SIZE) {
    batches.push(urls.slice(index, index + PROGRESS_BATCH_SIZE));
  }
  return batches;
}

// Chunks follow the list order so that a list growing page by page keeps its earlier chunks, and their cached
// progress, unchanged: only the new videos are requested.
export function progressChunks(videoUrls: string[]): string[][] {
  const urls = [...new Set(videoUrls.filter(Boolean))];
  const chunks: string[][] = [];
  for (let index = 0; index < urls.length; index += PROGRESS_CHUNK_SIZE) {
    chunks.push(urls.slice(index, index + PROGRESS_CHUNK_SIZE));
  }
  return chunks;
}

export function progressItemsByUrl(items: ProgressItem[]): Map<string, ProgressItem> {
  return new Map(items.map((item) => [item.videoUrl, item]));
}

export function updateProgressItems(
  items: ProgressItem[] | undefined,
  next: ProgressItem,
): ProgressItem[] | undefined {
  if (!items?.some((item) => item.videoUrl === next.videoUrl)) return items;
  return items.map((item) => (item.videoUrl === next.videoUrl ? next : item));
}
