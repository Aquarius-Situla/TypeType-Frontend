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
  return size === "large" ? "w-48 sm:w-56 lg:w-[44%]" : "w-40 sm:w-48 lg:w-[37%]";
}

export function watchSecondaryPanelClassName(
  size: RelatedVideoSize,
  liveChatOpen: boolean,
): string {
  const width = liveChatOpen
    ? "watch-secondary-panel-chat"
    : size === "large"
      ? "watch-secondary-panel watch-secondary-panel-large"
      : "watch-secondary-panel";
  return `w-full min-w-0 ${width} flex flex-col ${liveChatOpen ? "gap-4" : "gap-6"}`;
}
