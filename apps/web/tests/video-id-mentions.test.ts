import { expect, test } from "bun:test";
import { splitVideoIds } from "../src/lib/video-id-mentions";

const videos = (text: string) => splitVideoIds(text).filter((part) => part.type === "video");

test("Bilibili and NicoNico ids become internal watch links", () => {
  const [bv, av, sm] = videos("see BV17x411w7KC, av170001 and sm9!");
  expect(bv).toMatchObject({
    raw: "BV17x411w7KC",
    id: "BV17x411w7KC",
    path: "/watch?v=BV17x411w7KC",
  });
  expect(av).toMatchObject({ raw: "av170001", id: "av170001", path: "/watch?v=BV17x411w7KC" });
  expect(sm).toMatchObject({ raw: "sm9", id: "sm9", path: "/watch?v=sm9" });
});

test("ids glued to CJK text are found, the rest of the text is kept", () => {
  const parts = splitVideoIds("動画SM9です");
  expect(parts.map((part) => (part.type === "text" ? part.value : part.id))).toEqual([
    "動画",
    "sm9",
    "です",
  ]);
});

test("ordinary words, codecs and ids inside longer words are left alone", () => {
  for (const text of ["AV1 encode", "asm9", "sm9x", "BV1short", "BV17x411w7KCX", "soon", "nm"]) {
    expect(videos(text)).toEqual([]);
  }
});

test("offsets follow the original text", () => {
  expect(splitVideoIds("ab sm9", 10).map((part) => part.start)).toEqual([10, 13]);
});
