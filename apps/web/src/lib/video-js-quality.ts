type Rendition = { id: string; height?: number; frameRate?: number; bitrate?: number };

export function pickRendition<T extends Rendition>(
  renditions: T[],
  quality: string | undefined,
): T | null {
  const height = Number.parseInt(quality ?? "", 10);
  if (!Number.isFinite(height) || height <= 0) return null;
  const sized = renditions.filter((r) => (r.height ?? 0) > 0 && (r.height ?? 0) <= height);
  if (sized.length === 0) return null;
  return sized.reduce((best, r) => {
    const rank = (x: T) => [x.height ?? 0, x.frameRate ?? 0, x.bitrate ?? 0];
    const [a, b] = [rank(r), rank(best)];
    for (let i = 0; i < a.length; i++) {
      if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0) ? r : best;
    }
    return best;
  });
}
