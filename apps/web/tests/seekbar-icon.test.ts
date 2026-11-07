import { expect, test } from "bun:test";
import { seekbarIconSource } from "../src/lib/seekbar-icon";

test("everyone gets the TypeType icon by default", () => {
  expect(seekbarIconSource("typetype", "")).toBe("/seekbar-typetype.svg");
});

test("a custom icon comes from the instance", () => {
  expect(seekbarIconSource("custom", "/seekbar-icon/user/abc")).toContain("/seekbar-icon/user/abc");
});

test("a custom choice without an uploaded image falls back to the TypeType icon", () => {
  expect(seekbarIconSource("custom", "")).toBe("/seekbar-typetype.svg");
});

test("none keeps the plain player thumb", () => {
  expect(seekbarIconSource("none", "/seekbar-icon/user/abc")).toBeNull();
});
