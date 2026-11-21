import { useMemo } from "react";
import type { FocusSettings } from "../lib/api-focus";
import { normalizeFocusChannelKey } from "../lib/focus-block-error";
import { useFocus } from "./use-focus";

export type FocusVisualSettings = Pick<
  FocusSettings,
  "active" | "grayscaleThumbnails" | "studyChannelKeys"
>;

function createFocusStudyChannelSet(studyChannelKeys?: readonly string[]): Set<string> {
  return new Set((studyChannelKeys ?? []).map(normalizeFocusChannelKey));
}

function isFocusStudyChannel(studySet: ReadonlySet<string>, channelUrl?: string | null): boolean {
  if (!channelUrl) return false;
  return studySet.has(normalizeFocusChannelKey(channelUrl));
}

export function shouldGrayscaleFocusThumbnail(
  settings: FocusVisualSettings | undefined,
  channelUrl?: string | null,
  studySet?: ReadonlySet<string>,
): boolean {
  if (!settings?.active || !settings.grayscaleThumbnails) return false;
  const resolvedSet = studySet ?? createFocusStudyChannelSet(settings.studyChannelKeys);
  return !isFocusStudyChannel(resolvedSet, channelUrl);
}

export function useFocusVisualFilter() {
  const { query } = useFocus();
  const settings = query.data;
  const monochromeNonStudy = Boolean(settings?.active && settings.grayscaleThumbnails);
  const studySet = useMemo(
    () => createFocusStudyChannelSet(settings?.studyChannelKeys),
    [settings?.studyChannelKeys],
  );

  const isStudyChannel = (channelUrl?: string | null): boolean =>
    isFocusStudyChannel(studySet, channelUrl);

  const shouldGrayscaleChannel = (channelUrl?: string | null): boolean =>
    shouldGrayscaleFocusThumbnail(settings, channelUrl, studySet);

  return { monochromeNonStudy, isStudyChannel, shouldGrayscaleChannel };
}
