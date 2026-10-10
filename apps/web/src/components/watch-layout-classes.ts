export type WatchLayoutClasses = ReturnType<typeof getWatchLayoutClasses>;

export function getWatchLayoutClasses(
  cinemaMode: boolean,
  hasSecondaryContent: boolean,
  webFullscreen = false,
) {
  if (webFullscreen) {
    return {
      containerClass: "watch-layout-container m-0 p-0 w-full h-full",
      playerWrapClass:
        "watch-player-wrap fixed inset-0 z-50 w-screen h-screen bg-black overflow-hidden m-0 p-0",
      playerBoxClass: "watch-player-box w-full h-full relative m-0 p-0 rounded-none",
      playerClassName: "watch-player-surface w-full h-full dark rounded-none",
      mediaClassName: undefined,
    };
  }

  const anim = "[animation:page-fade-in_0.2s_ease-out]";
  const standardLayout = hasSecondaryContent
    ? "pt-2 sm:pt-3 lg:flex-row lg:items-stretch"
    : "pt-2 sm:pt-3 lg:items-center";
  return {
    containerClass: `watch-layout-container flex flex-col gap-4 xl:gap-5 ${
      cinemaMode ? "" : standardLayout
    } ${anim}`,
    playerWrapClass: cinemaMode
      ? "watch-player-wrap overflow-hidden bg-black"
      : `watch-player-wrap min-w-0 flex flex-col gap-3 ${
          hasSecondaryContent ? "flex-1 max-w-[133.333vh]" : "mx-auto w-full max-w-[1600px]"
        }`,
    playerBoxClass: cinemaMode
      ? "watch-player-box relative mx-auto aspect-video w-[min(100%,calc((100svh-4.5rem)*16/9))]"
      : "watch-player-box watch-player-anchor relative overflow-hidden rounded-none bg-black",
    playerClassName: cinemaMode
      ? "watch-player-surface w-full h-full dark [--video-aspect-ratio:16/9]"
      : "watch-player-surface",
    mediaClassName: cinemaMode ? "object-cover" : undefined,
  };
}

export function getWatchSecondaryMetaContainerClass(hasSideContent: boolean): string {
  return hasSideContent
    ? "min-w-0 flex-[2] max-w-[1200px] flex flex-col gap-4"
    : "min-w-0 w-full flex-1 max-w-full flex flex-col gap-4";
}
