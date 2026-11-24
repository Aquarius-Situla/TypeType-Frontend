export type LoadingMascotVariant = "normal" | "video-landscape" | "video-portrait";
export type VideoLoadingOrientation = "landscape" | "portrait";

const LOADING_MASCOT_SRCS: Record<LoadingMascotVariant, string> = {
  normal: "/reactions/loading.webp",
  "video-landscape": "/reactions/loading-watch.webp",
  "video-portrait": "/reactions/loading-shorts.webp",
};

export const LOADING_MASCOT_DIMENSIONS: Record<
  LoadingMascotVariant,
  { width: number; height: number }
> = {
  normal: { width: 320, height: 320 },
  "video-landscape": { width: 640, height: 480 },
  "video-portrait": { width: 360, height: 480 },
};

export function videoLoadingVariant(
  orientation: VideoLoadingOrientation = "landscape",
): LoadingMascotVariant {
  return orientation === "portrait" ? "video-portrait" : "video-landscape";
}

export function loadingMascotSrc(variant: LoadingMascotVariant): string {
  return LOADING_MASCOT_SRCS[variant];
}

export function allLoadingMascotPaths(): readonly string[] {
  return Object.values(LOADING_MASCOT_SRCS);
}
