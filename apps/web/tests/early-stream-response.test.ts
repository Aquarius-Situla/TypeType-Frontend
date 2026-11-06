import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { takeEarlyStreamResponse } from "../src/lib/early-stream-response";
import { streamEndpoint } from "../src/lib/stream-request";
import { toWatchSourceUrl } from "../src/lib/watch-url";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1] ?? "")
  .find((body) => body.includes("__typetypeEarlyStream"));

function runInline(path: string, search: string, stored: string | null = null) {
  const target: { __typetypeEarlyStream?: { endpoint: string } } = {};
  const asked: string[] = [];
  const fakeFetch = (url: string) => {
    asked.push(url);
    return Promise.resolve(new Response("{}"));
  };
  new Function("window", "location", "localStorage", "fetch", inline ?? "")(
    target,
    { pathname: path, search },
    { getItem: () => stored },
    fakeFetch,
  );
  return { endpoint: target.__typetypeEarlyStream?.endpoint ?? null, asked };
}

describe("early stream response", () => {
  test("index.html asks for the same endpoint as the app", () => {
    for (const v of [
      "BV1Xx4c6tEKM",
      "bv1Xx4c6tEKM",
      "BV1Xx4c6tEKM?p=3",
      "BV1Xx4c6tEKM?p=1",
      "sm46976467",
      "so47007615",
      "nm1234",
    ]) {
      const result = runInline("/watch", `?v=${encodeURIComponent(v)}`);
      expect(result.endpoint).toBe(streamEndpoint(toWatchSourceUrl(v)));
      expect(result.asked).toEqual([streamEndpoint(toWatchSourceUrl(v))]);
    }
  });

  test("index.html leaves YouTube, other pages and signed in visitors to the app", () => {
    expect(runInline("/watch", "?v=dQw4w9WgXcQ").asked).toEqual([]);
    expect(runInline("/search", "?v=sm46976467").asked).toEqual([]);
    expect(runInline("/watch", "?v=sm46976467", '{"token":"t"}').asked).toEqual([]);
  });

  test("the first request for the endpoint takes the answer once", () => {
    const response = Promise.resolve(new Response("{}"));
    window.__typetypeEarlyStream = { endpoint: "/api/streams/niconico?url=a", response };
    expect(takeEarlyStreamResponse("/api/streams/niconico?url=b")).toBeNull();
    expect(takeEarlyStreamResponse("/api/streams/niconico?url=a")).toBe(response);
    expect(takeEarlyStreamResponse("/api/streams/niconico?url=a")).toBeNull();
  });
});
