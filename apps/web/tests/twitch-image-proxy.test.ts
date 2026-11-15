import { expect, test } from "bun:test";
import { proxyImage } from "../src/lib/proxy";

const target = (proxied: string) =>
  new URL(proxied, "https://example.test").searchParams.get("url");

test("loads Twitch previews, box art, avatars, badges and chat emotes through the instance proxy", () => {
  for (const image of [
    "https://static-cdn.jtvnw.net/previews-ttv/live_user_riotgames-640x360.jpg",
    "https://static-cdn.jtvnw.net/ttv-boxart/21779-285x380.jpg",
    "https://static-cdn.jtvnw.net/jtv_user_pictures/riotgames-profile_image-300x300.png",
    "https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/1.0",
    "https://static-cdn.jtvnw.net/badges/v1/3fea520d-32b9-4b5f-a83e-64946a43c58f/1",
    "https://cdn.7tv.app/emote/01F6MZGCNG000255K4X1K7NTHR/1x.webp",
    "https://cdn.betterttv.net/emote/5f1b0186cf6d2144653d2970/1x.webp",
    "https://cdn.frankerfacez.com/emote/128054/1",
  ]) {
    expect(proxyImage(image)).toContain("/proxy?url=");
    expect(target(proxyImage(image))).toBe(image);
  }
  expect(proxyImage("https://example.com/a.png")).toBe("https://example.com/a.png");
  expect(proxyImage("https://7tv.app/emote/1")).toBe("https://7tv.app/emote/1");
});
