import type { BlockableVideo } from "./blocked-content";

function isShortFormVideo(video: BlockableVideo): boolean {
  if (video.isShortFormContent === true) return true;
  if ((video.streamType ?? "").toLowerCase().includes("short")) return true;
  return [video.id, video.url].some((value) => {
    if (!value) return false;
    try {
      return new URL(value).pathname.split("/").some((part) => part.toLowerCase() === "shorts");
    } catch {
      return /(?:^|\/)shorts(?:\/|$)/i.test(value);
    }
  });
}

export function isShortFormContentHidden(video: BlockableVideo, hideShorts: boolean): boolean {
  return hideShorts && isShortFormVideo(video);
}

export function filterShortFormContent<T extends BlockableVideo>(
  videos: T[],
  hideShorts: boolean,
): T[] {
  return videos.filter((video) => !isShortFormContentHidden(video, hideShorts));
}

export function isMembersOnlyContentHidden(
  video: BlockableVideo,
  hideMembersOnlyContent: boolean,
): boolean {
  return hideMembersOnlyContent && video.requiresMembership === true;
}

export function filterMembersOnlyContent<T extends BlockableVideo>(
  videos: T[],
  hideMembersOnlyContent: boolean,
): T[] {
  return videos.filter((video) => !isMembersOnlyContentHidden(video, hideMembersOnlyContent));
}
