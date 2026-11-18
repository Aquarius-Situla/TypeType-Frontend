import { expect, test } from "bun:test";
import { channelAliasLink, channelRouteFromVideos } from "../src/lib/channel-alias-url";

test("rebuilds channel aliases from the checked name", () => {
  expect(channelAliasLink("youtube.com/c/wankilfr/streams?x=1")).toEqual({
    url: "https://www.youtube.com/c/wankilfr",
    tab: "live",
  });
  expect(channelAliasLink("https://www.youtube.com/c/caf%C3%A9")?.url).toBe(
    "https://www.youtube.com/c/caf%C3%A9",
  );
});

test("leaves ordinary search text and stable channel links alone", () => {
  expect(channelAliasLink("wankil studio")).toBeNull();
  expect(channelAliasLink("wankilfr")).toBeNull();
  expect(channelAliasLink("https://www.youtube.com/@wankil")).toBeNull();
  expect(channelAliasLink("ftp://www.youtube.com/c/wankilfr")).toBeNull();
});

test("finds the stable channel from the channel's own videos", () => {
  const stable = "https://www.youtube.com/channel/UCYGjxo5ifuhnmvhPvCc3DJQ";
  const videos = [
    {
      channelName: "Guest",
      channelUrl: "https://www.youtube.com/channel/UCrPseYLGpNygVi34QpGNqpA",
    },
    { channelName: "Wankil", channelUrl: stable },
  ];
  expect(channelRouteFromVideos("Wankil", videos)).toEqual({
    provider: "youtube",
    id: "UCYGjxo5ifuhnmvhPvCc3DJQ",
  });
  expect(channelRouteFromVideos("Nobody", videos)).toBeNull();
  expect(channelRouteFromVideos(undefined, videos)).toBeNull();
});
