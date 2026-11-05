import { describe, expect, test } from "bun:test";
import { proxyImage } from "../src/lib/proxy";

const target = (proxied: string) =>
  new URL(proxied, "https://example.test").searchParams.get("url");

describe("Bilibili image sizes", () => {
  test("asks the CDN for a card-sized webp cover instead of the original", () => {
    expect(target(proxyImage("http://i0.hdslb.com/bfs/archive/cover.jpg"))).toBe(
      "https://i0.hdslb.com/bfs/archive/cover.jpg@672w_378h_1c.webp",
    );
  });

  test("keeps a larger cover for the player poster", () => {
    expect(target(proxyImage("https://i1.hdslb.com/bfs/archive/cover.jpg", "poster"))).toBe(
      "https://i1.hdslb.com/bfs/archive/cover.jpg@1280w_720h_1c.webp",
    );
  });

  test("sizes avatars and leaves already sized or other images alone", () => {
    expect(target(proxyImage("https://i2.hdslb.com/bfs/face/me.jpg"))).toBe(
      "https://i2.hdslb.com/bfs/face/me.jpg@240w_240h_1c.webp",
    );
    expect(target(proxyImage("https://i0.hdslb.com/bfs/archive/c.jpg@240w_240h_1c_1s.webp"))).toBe(
      "https://i0.hdslb.com/bfs/archive/c.jpg@240w_240h_1c_1s.webp",
    );
    expect(target(proxyImage("https://i0.hdslb.com/bfs/new_dyn/post.png"))).toBe(
      "https://i0.hdslb.com/bfs/new_dyn/post.png",
    );
  });
});
