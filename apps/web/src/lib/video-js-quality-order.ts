import type { MediaVideoRendition, QualityOption } from "@videojs/react";

const AUTO = "auto";

function size(rendition: MediaVideoRendition | undefined): number {
  if (!rendition) return 0;
  if (rendition.width && rendition.height) return Math.min(rendition.width, rendition.height);
  return rendition.height ?? rendition.width ?? 0;
}

export function qualityOptionsBestFirst(
  options: readonly QualityOption[],
  renditions: readonly MediaVideoRendition[],
): QualityOption[] {
  const byId = new Map(renditions.map((rendition) => [rendition.id, rendition]));
  const rank = (option: QualityOption) => {
    const rendition = byId.get(option.value);
    return [size(rendition), rendition?.frameRate ?? 0, rendition?.bitrate ?? 0];
  };
  const auto = options.filter((option) => option.value === AUTO);
  const rest = options
    .filter((option) => option.value !== AUTO)
    .sort((left, right) => {
      const a = rank(left);
      const b = rank(right);
      return b[0] - a[0] || b[1] - a[1] || b[2] - a[2];
    });
  return [...auto, ...rest];
}
