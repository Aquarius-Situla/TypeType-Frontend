import { expect, test } from "bun:test";
import { nextServiceRoute, SERVICE_OPTIONS, serviceAlternatives } from "../src/lib/service-options";

test("exposes YouTube, NicoNico and BiliBili in the navbar order", () => {
  expect(SERVICE_OPTIONS.map((service) => service.id)).toEqual([0, 6, 5]);
});

test("excludes the active service from navbar alternatives", () => {
  expect(serviceAlternatives(6).map((service) => service.label)).toEqual(["YouTube", "BiliBili"]);
});

test("keeps the current search query when switching service", () => {
  expect(nextServiceRoute("/search", "?q=lofi&service=0", 5)).toEqual({
    to: "/search",
    search: { q: "lofi", service: 5 },
  });
});

test("routes between the dedicated session pages", () => {
  expect(nextServiceRoute("/youtube-session", "", 5)).toEqual({ to: "/bilibili-session" });
  expect(nextServiceRoute("/bilibili-session", "?returnTo=%2Fwatch", 0)).toEqual({
    to: "/youtube-session",
    search: { returnTo: undefined },
  });
});
