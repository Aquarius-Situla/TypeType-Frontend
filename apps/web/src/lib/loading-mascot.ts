import type { ResolvedTheme } from "../stores/theme-store";

export type LoadingMascotVariant = "normal" | "video-landscape" | "video-portrait";
export type VideoLoadingOrientation = "landscape" | "portrait";

const LOADING_MASCOT_GIFS: Record<LoadingMascotVariant, Record<ResolvedTheme, string>> = {
  normal: {
    dark: "/loading/normal/loading-dark.gif",
    light: "/loading/normal/loading-light.gif",
  },
  "video-landscape": {
    dark: "/loading/video/loading-dark.gif",
    light: "/loading/video/loading-light.gif",
  },
  "video-portrait": {
    dark: "/loading/video/loading-vertical-dark.gif",
    light: "/loading/video/loading-vertical-light.gif",
  },
};

export const LOADING_MASCOT_DIMENSIONS: Record<
  LoadingMascotVariant,
  { width: number; height: number }
> = {
  normal: { width: 320, height: 297 },
  "video-landscape": { width: 640, height: 457 },
  "video-portrait": { width: 360, height: 457 },
};

export function videoLoadingVariant(
  orientation: VideoLoadingOrientation = "landscape",
): LoadingMascotVariant {
  return orientation === "portrait" ? "video-portrait" : "video-landscape";
}

export function loadingMascotSrc(variant: LoadingMascotVariant, theme: ResolvedTheme): string {
  return LOADING_MASCOT_GIFS[variant][theme];
}

export function allLoadingMascotPaths(): readonly string[] {
  return Object.values(LOADING_MASCOT_GIFS).flatMap((byTheme) => [byTheme.dark, byTheme.light]);
}
