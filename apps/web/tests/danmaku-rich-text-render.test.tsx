import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DanmakuRichText } from "../src/components/danmaku-rich-text";

test("renders known emote codes as images with no-referrer", () => {
  const html = renderToStaticMarkup(<DanmakuRichText text="hi [doge]" fontSize={20} />);
  expect(html).toContain("<img");
  expect(html.toLowerCase()).toContain('referrerpolicy="no-referrer"');
  expect(html).toContain('alt="[doge]"');
  expect(html).toContain("height:20px");
});

test("loads emotes through the instance proxy instead of the Bilibili CDN", () => {
  const html = renderToStaticMarkup(<DanmakuRichText text="hi [doge]" fontSize={20} />);
  const src = html.match(/<img[^>]*src="([^"]*)"/)?.[1]?.replaceAll("&amp;", "&") ?? "";
  expect(src).toContain("/proxy?url=");
  expect(new URL(src, "https://example.test").searchParams.get("url")).toStartWith(
    "https://i0.hdslb.com/bfs/emote/",
  );
});

test("renders unknown bracket codes as plain text", () => {
  const html = renderToStaticMarkup(<DanmakuRichText text="[01:23] hi" fontSize={20} />);
  expect(html).not.toContain("<img");
  expect(html).toContain("[01:23] hi");
});
