import { expect, test } from "bun:test";
import { qualityLabelHeight, qualityOptionHeight } from "../src/lib/player-quality";

test("prefers the quality height and falls back to a positive option height", () => {
  expect(qualityOptionHeight({ label: "720p", quality: { height: 1080 } })).toBe(1080);
  expect(qualityOptionHeight({ label: "720p", height: 1080 })).toBe(1080);
});

test("falls back to the label when heights are missing or zero", () => {
  expect(qualityOptionHeight({ label: "720p", quality: { height: 0 }, height: 0 })).toBe(720);
  expect(qualityOptionHeight({ label: "1080p60" })).toBe(1080);
});

test("rejects labels without a positive resolution", () => {
  expect(qualityLabelHeight("Auto")).toBeNull();
  expect(qualityLabelHeight("0p")).toBeNull();
});
