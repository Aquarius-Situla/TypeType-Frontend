import { expect, test } from "bun:test";
import { emoteGroups, filterEmoteGroups, insertEmote } from "../src/lib/twitch-emote-picker";
import type { TwitchThirdPartyEmote, TwitchUserEmotes } from "../src/types/twitch";

const account: TwitchUserEmotes = {
  channelId: "42",
  emotes: [
    { id: "25", name: "Kappa", type: "GLOBALS" },
    { id: "900", name: "chanHype", type: "SUBSCRIPTIONS", ownerId: "42" },
    { id: "901", name: "otherLove", type: "SUBSCRIPTIONS", ownerId: "77" },
  ],
};
const thirdParty: TwitchThirdPartyEmote[] = [
  { name: "catJAM", url: "https://cdn.7tv.app/emote/a/1x.webp", provider: "7tv" },
  { name: "Kappa", url: "https://cdn.betterttv.net/emote/b/1x.webp", provider: "bttv" },
  {
    name: "RainTime",
    url: "https://cdn.7tv.app/emote/c/1x.webp",
    provider: "7tv",
    zeroWidth: true,
  },
];

test("groups the channel emotes first and keeps one emote per name", () => {
  const groups = emoteGroups(account, thirdParty);
  expect(groups.map((group) => [group.id, group.emotes.map((emote) => emote.name)])).toEqual([
    ["channel", ["chanHype"]],
    ["twitch", ["Kappa", "otherLove"]],
    ["7tv", ["catJAM"]],
  ]);
  expect(groups[0]?.emotes[0]?.url).toBe(
    "https://static-cdn.jtvnw.net/emoticons/v2/900/default/dark/1.0",
  );
});

test("works without a linked account and filters by name", () => {
  const groups = emoteGroups(undefined, thirdParty);
  expect(groups.map((group) => group.id)).toEqual(["7tv", "bttv"]);
  expect(filterEmoteGroups(groups, " JAM ").map((group) => group.emotes.length)).toEqual([1]);
  expect(filterEmoteGroups(groups, "nothing")).toEqual([]);
});

test("inserts an emote at the caret with the spaces chat needs", () => {
  expect(insertEmote("", 0, 0, "Kappa")).toEqual({ text: "Kappa ", caret: 6 });
  expect(insertEmote("hello", 5, 5, "Kappa")).toEqual({ text: "hello Kappa ", caret: 12 });
  expect(insertEmote("hello world", 6, 11, "Kappa")).toEqual({ text: "hello Kappa ", caret: 12 });
  expect(insertEmote("a b", 1, 1, "Kappa")).toEqual({ text: "a Kappa b", caret: 7 });
  expect(insertEmote("x".repeat(498), 498, 498, "Kappa")).toBeNull();
});
