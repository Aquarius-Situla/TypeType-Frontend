type Args = {
  streamId: string;
  retryKey: number;
  sourceKey: string;
  highQuality: boolean;
};

export function buildWatchPlayerKey(args: Args) {
  const sabr = args.sourceKey.startsWith("sabr:");
  const source = sabr ? "sabr" : args.sourceKey;
  const retry = sabr ? 0 : args.retryKey;
  const quality = !sabr && args.highQuality ? "hq" : "std";
  return [args.streamId, retry, source, quality].join(":");
}
