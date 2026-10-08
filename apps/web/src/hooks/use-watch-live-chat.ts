import { useEffect } from "react";
import { useLiveChatStore } from "../lib/live-chat-store";

export function useWatchLiveChat(videoId: string, onPlayerEnded: () => void) {
  const open = useLiveChatStore((state) => state.open && state.videoId === videoId);
  useEffect(
    () => () => {
      const state = useLiveChatStore.getState();
      if (state.videoId === videoId) state.close();
    },
    [videoId],
  );
  return {
    open,
    onEnded: () => {
      useLiveChatStore.getState().markEnded(videoId);
      onPlayerEnded();
    },
  };
}
