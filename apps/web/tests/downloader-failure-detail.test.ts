import { expect, test } from "bun:test";
import { downloaderFailureDetail, downloaderStatusMessage } from "../src/lib/downloader-display";

test("a failed download keeps the downloader error as a detail line", () => {
  expect(downloaderFailureDetail("failed", "failed", null, " mux failed: disk full ")).toBe(
    "mux failed: disk full",
  );
  expect(downloaderStatusMessage("failed", "failed", null, "mux failed", false)).toBe(
    "The download could not be completed.",
  );
});

test("no detail while running, for storage errors or without error text", () => {
  expect(downloaderFailureDetail("running", "download", null, "slow")).toBeNull();
  expect(downloaderFailureDetail("failed", "failed", "insufficient_storage", "full")).toBeNull();
  expect(downloaderFailureDetail("failed", "failed", null, "  ")).toBeNull();
});

test("an unavailable exact quality shows its own message instead of the generic one", () => {
  const text = "The requested 1080p quality is not available.";
  expect(
    downloaderStatusMessage("failed", "failed", "exact_selection_unavailable", text, false),
  ).toBe(text);
  expect(
    downloaderFailureDetail("failed", "failed", "exact_selection_unavailable", text),
  ).toBeNull();
});
