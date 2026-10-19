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

test("renders unknown bracket codes as plain text", () => {
  const html = renderToStaticMarkup(<DanmakuRichText text="[01:23] hi" fontSize={20} />);
  expect(html).not.toContain("<img");
  expect(html).toContain("[01:23] hi");
});
