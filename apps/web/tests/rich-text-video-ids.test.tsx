import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RichText } from "../src/components/rich-text";

test("ids in Bilibili and NicoNico comments link to the watch page and show the id until a title loads", () => {
  const html = renderToStaticMarkup(
    <RichText
      text="see sm9 or https://www.bilibili.com/video/BV17x411w7KC"
      videoUrl="https://www.bilibili.com/video/BV1GJ411x7h7"
    />,
  );
  expect(html).toContain('href="/watch?v=sm9"');
  expect(html).toContain(">sm9</a>");
  expect(html).toContain('href="https://www.bilibili.com/video/BV17x411w7KC"');
  expect(html.match(/<a /g)?.length).toBe(2);
});

test("YouTube comments keep such words as text", () => {
  const html = renderToStaticMarkup(
    <RichText text="sm9 and av170001" videoUrl="https://www.youtube.com/watch?v=aqz-KE-bpKQ" />,
  );
  expect(html).not.toContain("<a ");
});
