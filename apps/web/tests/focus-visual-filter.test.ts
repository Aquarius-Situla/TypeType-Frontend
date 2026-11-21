import { expect, test } from "bun:test";
import {
  type FocusVisualSettings,
  shouldGrayscaleFocusThumbnail,
} from "../src/hooks/use-focus-visual-filter";

const activeFocus: FocusVisualSettings = {
  active: true,
  grayscaleThumbnails: true,
  studyChannelKeys: ["https://space.bilibili.com/23630128", "https://youtube.com/channel/UCstudy"],
};

test("keeps study channels colored across URL variants and grayscales non-study channels", () => {
  expect(shouldGrayscaleFocusThumbnail(activeFocus, "https://space.bilibili.com/23630128/")).toBe(
    false,
  );
  expect(
    shouldGrayscaleFocusThumbnail(activeFocus, "http://www.youtube.com/channel/UCstudy/videos"),
  ).toBe(false);
  expect(shouldGrayscaleFocusThumbnail(activeFocus, "https://www.youtube.com/channel/UCfun")).toBe(
    true,
  );
  expect(shouldGrayscaleFocusThumbnail(activeFocus, "")).toBe(true);
  expect(shouldGrayscaleFocusThumbnail(activeFocus, undefined)).toBe(true);
});

test("disables grayscale when Focus is inactive or grayscaleThumbnails is off", () => {
  expect(
    shouldGrayscaleFocusThumbnail(
      { ...activeFocus, active: false },
      "https://www.youtube.com/channel/UCfun",
    ),
  ).toBe(false);
  expect(
    shouldGrayscaleFocusThumbnail(
      { ...activeFocus, grayscaleThumbnails: false },
      "https://www.youtube.com/channel/UCfun",
    ),
  ).toBe(false);
});
