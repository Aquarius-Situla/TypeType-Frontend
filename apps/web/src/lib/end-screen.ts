import type { EndScreenItem } from "../types/api";

export function visibleEndScreenElements(
  elements: readonly EndScreenItem[],
  positionMs: number,
): EndScreenItem[] {
  return elements.filter((element) => positionMs >= element.startMs && positionMs < element.endMs);
}

/** Percent box of an element inside the video frame, kept inside the frame. */
export function endScreenBox(
  element: EndScreenItem,
  frameAspectRatio: number,
): { left: number; top: number; width: number; height: number } {
  const width = Math.min(element.width, 1 - element.left) * 100;
  const height = Math.min(
    (width * frameAspectRatio) / element.aspectRatio,
    (1 - element.top) * 100,
  );
  return { left: element.left * 100, top: element.top * 100, width, height };
}
