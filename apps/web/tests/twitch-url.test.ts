import { expect, test } from "bun:test";
import { twitchUrlTarget } from "../src/lib/twitch-url";

test("opens Twitch channels and videos pasted in the search bar", () => {
  expect(twitchUrlTarget("https://www.twitch.tv/SomeChannel")).toEqual({ c: "somechannel" });
  expect(twitchUrlTarget("twitch.tv/videos/2928081988")).toEqual({ v: "2928081988" });
  expect(twitchUrlTarget("https://m.twitch.tv/somechannel")).toEqual({ c: "somechannel" });
});

test("ignores other links and Twitch pages", () => {
  expect(twitchUrlTarget("https://youtube.com/watch?v=x")).toBeNull();
  expect(twitchUrlTarget("https://www.twitch.tv/directory")).toBeNull();
  expect(twitchUrlTarget("just chatting")).toBeNull();
});
