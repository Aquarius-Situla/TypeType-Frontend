import { useCallback, useSyncExternalStore } from "react";
import { type ChatSnapshot, chatSnapshot, subscribeChat } from "../lib/twitch-chat-stream";

export function useTwitchChat(login: string): ChatSnapshot {
  const subscribe = useCallback((listener: () => void) => subscribeChat(login, listener), [login]);
  const snapshot = useCallback(() => chatSnapshot(login), [login]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
