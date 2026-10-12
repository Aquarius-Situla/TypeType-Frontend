type Args = {
  streamId: string;
  retryKey: number;
  sourceKey: string;
  highQuality: boolean;
  hasThumbnails: boolean;
  hasChapters: boolean;
};

export function buildWatchPlayerKey(args: Args) {
  const sabr = args.sourceKey.startsWith("sabr:");
  const source = sabr ? "sabr" : args.sourceKey;
  const retry = sabr ? 0 : args.retryKey;
  const quality = !sabr && args.highQuality ? "hq" : "std";
  const thumbnails = !sabr && args.hasThumbnails ? "thumbs" : "no-thumbs";
  const chapters = !sabr && args.hasChapters ? "chapters" : "no-chapters";
  return [args.streamId, retry, source, quality, thumbnails, chapters].join(":");
}
