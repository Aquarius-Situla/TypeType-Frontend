import { expect, test } from "bun:test";
import { proxyImage } from "../src/lib/proxy";

const target = (proxied: string) =>
  new URL(proxied, "https://example.test").searchParams.get("url");

test("loads NicoNico thumbnails, posters and avatars through the instance proxy", () => {
  for (const image of [
    "https://nicovideo.cdn.nimg.jp/thumbnails/47019673/47019673.97813353",
    "https://img.cdn.nimg.jp/s/nicovideo/thumbnails/47000346/47000346.84078409.original/r640x360l",
    "https://goptim.video.nimg.jp/thumbnail/1280x720?b=p&i=47019673",
    "https://img.nicoprofile.nimg.jp/usericon/1515/15159541.jpg?1709276813",
    "https://secure-dcdn.cdn.nimg.jp/comch/channel-icon/128x128/ch2632720.jpg",
  ]) {
    expect(proxyImage(image)).toContain("/proxy?url=");
    expect(target(proxyImage(image))).toBe(image);
  }
});
