type QualityOptionLike = {
  label: string;
  height?: number;
  quality?: { height?: number | null } | null;
};

export function qualityLabelHeight(label: string): number | null {
  const match = label.match(/(\d+)/);
  if (!match) return null;
  const height = Number(match[1]);
  return Number.isFinite(height) && height > 0 ? height : null;
}

export function qualityOptionHeight(option: QualityOptionLike): number | null {
  if (option.quality?.height && option.quality.height > 0) return option.quality.height;
  if (option.height && option.height > 0) return option.height;
  return qualityLabelHeight(option.label);
}
