import { useEffect, useState } from "react";
import { AD_ROTATION, type Ad, nextAdIndex } from "../lib/ad-catalog";
import { type AdProgress, freshAdProgress } from "../lib/ad-progress";
import { readAdVault, rememberAdFinished, rememberAdPending } from "../lib/ad-vault";

const SAVE_EVERY_MS = 1000;

// The ad owed to one video: none (`index` null), the next of the rotation, or an unfinished one.
type AdSlot = { videoId: string; index: number | null; progress: AdProgress };

export type AdBreak = { ad: Ad | null; progress: AdProgress; finish: () => void };

function slotFor(videoId: string, enabled: boolean): AdSlot {
  const vault = readAdVault();
  const index = enabled ? nextAdIndex(vault) : null;
  const left = vault.pending && vault.pending.index === index ? vault.pending : null;
  if (!left) return { videoId, index, progress: freshAdProgress() };
  const { index: _index, ...progress } = left;
  return { videoId, index, progress };
}

// Decides which ad plays before a video. Ad mode reads nothing but local storage here, so a viewer
// who never turned it on triggers no request at all.
export function useAdBreak(videoId: string, enabled: boolean): AdBreak {
  const [slot, setSlot] = useState(() => slotFor(videoId, enabled));
  // A new video gets its own slot during render, before the previous overlay can show again.
  if (slot.videoId !== videoId) setSlot(slotFor(videoId, enabled));
  const index = slot.videoId === videoId && enabled ? slot.index : null;
  const progress = slot.progress;

  // The ad keeps `progress` up to date in place; saving it on a timer is what lets an ad that the
  // viewer walked away from resume before their next video.
  useEffect(() => {
    if (index === null) return;
    const save = () => rememberAdPending({ index, ...progress });
    save();
    const timer = window.setInterval(save, SAVE_EVERY_MS);
    return () => {
      window.clearInterval(timer);
      // Not after `finish`, which has just cleared the pending ad.
      if (readAdVault().pending) save();
    };
  }, [index, progress]);

  return {
    ad: index === null ? null : (AD_ROTATION[index] ?? null),
    progress,
    finish: () => {
      const ad = index === null ? undefined : AD_ROTATION[index];
      if (ad && index !== null) rememberAdFinished(ad.id, (index + 1) % AD_ROTATION.length);
      setSlot({ videoId, index: null, progress: freshAdProgress() });
    },
  };
}
