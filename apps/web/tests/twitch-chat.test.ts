import { describe, expect, test } from "bun:test";
import { splitEvents } from "../src/lib/event-stream";
import { applyChatEvent, EMPTY_CHAT, MAX_CHAT_MESSAGES } from "../src/lib/twitch-chat";
import type { TwitchChatEvent } from "../src/types/twitch";

const message = (id: string, login = "a"): TwitchChatEvent => ({
  type: "message",
  id,
  login,
  text: id,
  time: "2026-11-14T22:00:00Z",
});

const room = { followersOnly: 0, slow: 0, emoteOnly: false, subsOnly: false, uniqueChat: false };

describe("twitch chat state", () => {
  test("marks moderated messages as deleted instead of dropping them", () => {
    let state = { ...EMPTY_CHAT, messages: [message("1"), message("2", "b"), message("3", "b")] };
    state = applyChatEvent(state, { type: "delete", targetId: "1", time: "" });
    expect(state.messages.map((m) => Boolean(m.deleted))).toEqual([true, false, false]);
    state = applyChatEvent(state, { type: "clear", login: "b", time: "" });
    expect(state.messages.every((m) => m.deleted)).toBe(true);
  });

  test("keeps the room state apart from messages", () => {
    const state = applyChatEvent(EMPTY_CHAT, { type: "room", room, time: "" });
    expect(state.room).toEqual(room);
    expect(state.messages).toEqual([]);
  });

  test("ignores history replayed after a reconnect", () => {
    let state = applyChatEvent(EMPTY_CHAT, message("1"));
    state = applyChatEvent(state, message("1"));
    expect(state.messages).toHaveLength(1);
  });

  test("keeps a bounded history", () => {
    let state = EMPTY_CHAT;
    for (let i = 0; i < MAX_CHAT_MESSAGES + 5; i++)
      state = applyChatEvent(state, message(String(i)));
    expect(state.messages.length).toBe(MAX_CHAT_MESSAGES);
    expect(state.messages[0]?.id).toBe("5");
  });
});

describe("event stream parsing", () => {
  test("returns complete events and keeps the partial tail", () => {
    const { events, rest } = splitEvents(
      'data: {"a":1}\n\n: ping\n\ndata: {"b":2}\r\n\r\ndata: {"c"',
    );
    expect(events).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('data: {"c"');
  });
});
