import { expect, test } from "bun:test";
import { isWebKitBrowser, stillEmoteUrl } from "../src/lib/twitch-emote-still";

test("animated emotes map to the still frame each CDN publishes", () => {
  expect(stillEmoteUrl("https://cdn.betterttv.net/emote/566ca38765dbbdab32ec0560/1x.webp")).toBe(
    "https://cdn.betterttv.net/emote/566ca38765dbbdab32ec0560/static/1x.webp",
  );
  expect(stillEmoteUrl("https://cdn.7tv.app/emote/01FCY771D800007PQ2DF3GDTN6/2x.webp")).toBe(
    "https://cdn.7tv.app/emote/01FCY771D800007PQ2DF3GDTN6/2x_static.webp",
  );
  expect(
    stillEmoteUrl("https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_abc/default/dark/1.0"),
  ).toBe("https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_abc/static/dark/1.0");
  const ffz = "https://cdn.frankerfacez.com/emote/381875/1";
  expect(stillEmoteUrl(ffz)).toBe(ffz);
});

test("Safari and every iOS browser are WebKit, Chrome, Edge and Firefox are not", () => {
  const mac =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)";
  expect(isWebKitBrowser(`${mac} Version/26.0 Safari/605.1.15`, 0)).toBe(true);
  expect(isWebKitBrowser(`${mac} Chrome/142.0 Safari/537.36`, 0)).toBe(false);
  expect(isWebKitBrowser(`${mac} Chrome/142.0 Safari/537.36 Edg/142.0`, 0)).toBe(false);
  expect(
    isWebKitBrowser(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5 like Mac OS X) CriOS/142.0 Mobile/15E148",
      5,
    ),
  ).toBe(true);
  expect(isWebKitBrowser(`${mac} Version/26.0 Safari/605.1.15`, 5)).toBe(true);
  expect(
    isWebKitBrowser("Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0", 0),
  ).toBe(false);
});
