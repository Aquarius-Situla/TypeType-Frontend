import type { VideoStream } from "../types/stream";

export function isUpcomingStream(stream: Pick<VideoStream, "publishedAt">): boolean {
  return typeof stream.publishedAt === "number" && stream.publishedAt > Date.now();
}
