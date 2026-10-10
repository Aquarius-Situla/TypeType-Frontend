import type { RelatedVideoSize, VideoGridColumns } from "../types/user";

const GRID_BY_COLUMNS: Record<VideoGridColumns, string> = {
  0: "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4",
  4: "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4",
  5: "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-5",
  6: "grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 sm:gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
};

export function videoGridClassName(columns: VideoGridColumns): string {
  return GRID_BY_COLUMNS[columns] ?? GRID_BY_COLUMNS[0];
}

export function relatedVideoThumbnailClassName(size: RelatedVideoSize): string {
  return size === "large" ? "w-40 sm:w-48" : "w-32 sm:w-40";
}

export function relatedVideoPanelClassName(size: RelatedVideoSize): string {
  return size === "large" ? "lg:min-w-80" : "lg:min-w-64";
}

export function watchSecondaryPanelClassName(
  size: RelatedVideoSize,
  liveChatOpen: boolean,
): string {
  const width = liveChatOpen
    ? "lg:w-[clamp(21rem,34vw,36.25rem)]"
    : size === "large"
      ? "lg:w-80 xl:w-96 2xl:w-[28rem]"
      : "lg:w-72 xl:w-80 2xl:w-96";
  return `w-full lg:flex-none ${width} flex flex-col ${liveChatOpen ? "gap-4" : "gap-6"}`;
}
