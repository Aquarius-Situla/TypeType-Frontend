import type { TwitchChatEvent, TwitchRoomState } from "../types/twitch";

export const MAX_CHAT_MESSAGES = 200;

export type ChatState = { messages: TwitchChatEvent[]; room: TwitchRoomState | null };

export const EMPTY_CHAT: ChatState = { messages: [], room: null };

function markDeleted(
  messages: TwitchChatEvent[],
  match: (message: TwitchChatEvent) => boolean,
): TwitchChatEvent[] {
  return messages.map((message) => (match(message) ? { ...message, deleted: true } : message));
}

export function applyChatEvent(state: ChatState, event: TwitchChatEvent): ChatState {
  switch (event.type) {
    case "room":
      return event.room ? { ...state, room: event.room } : state;
    case "delete":
      return { ...state, messages: markDeleted(state.messages, (m) => m.id === event.targetId) };
    case "clear":
      return {
        ...state,
        messages: event.login
          ? markDeleted(state.messages, (m) => m.login === event.login)
          : state.messages.map((m) => ({ ...m, deleted: true })),
      };
    default: {
      if (event.id && state.messages.some((message) => message.id === event.id)) return state;
      const messages =
        state.messages.length >= MAX_CHAT_MESSAGES
          ? state.messages.slice(1)
          : state.messages.slice();
      messages.push(event);
      return { ...state, messages };
    }
  }
}
