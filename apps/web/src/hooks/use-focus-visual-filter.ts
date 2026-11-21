import { useMemo } from "react";
import { normalizeFocusChannelKey } from "../lib/focus-block-error";
import { useFocus } from "./use-focus";

export function useFocusVisualFilter() {
  const { query } = useFocus();
  const settings = query.data;
  const monochromeNonStudy = Boolean(settings?.active && settings.grayscaleThumbnails);
  const studySet = useMemo(
    () => new Set((settings?.studyChannelKeys ?? []).map(normalizeFocusChannelKey)),
    [settings?.studyChannelKeys],
  );

  const isStudyChannel = (channelUrl?: string | null): boolean => {
    if (!channelUrl) return false;
    return studySet.has(normalizeFocusChannelKey(channelUrl));
  };

  const shouldGrayscaleChannel = (channelUrl?: string | null): boolean => {
    if (!monochromeNonStudy) return false;
    return !isStudyChannel(channelUrl);
  };

  return { monochromeNonStudy, isStudyChannel, shouldGrayscaleChannel };
}
