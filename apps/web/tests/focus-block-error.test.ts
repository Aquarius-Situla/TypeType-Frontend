import { expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import {
  normalizeFocusChannelKey,
  parseFocusBlockError,
  remainingCoolingOffHours,
} from "../src/lib/focus-block-error";

test("normalizes focus channel URLs consistently with backend keys", () => {
  expect(normalizeFocusChannelKey("http://www.youtube.com/channel/UCstudy/videos?sort=dd")).toBe(
    "https://youtube.com/channel/UCstudy",
  );
  expect(normalizeFocusChannelKey("https://m.youtube.com/@teacher/featured/")).toBe(
    "https://youtube.com/@teacher",
  );
  expect(normalizeFocusChannelKey("https://space.bilibili.com/12345/")).toBe(
    "https://space.bilibili.com/12345",
  );
});

test("parses structured focus block errors and cooling-off hours", () => {
  const challenge = new ApiError(
    "Focus mode blocks videos outside your study group",
    403,
    "focus_challenge_required",
    "req-1",
    null,
    {
      channelUrl: "https://www.youtube.com/channel/UCgeekerwan",
      channelName: "Geekerwan",
      channelAvatarUrl: "https://img/avatar.jpg",
      videoTitle: "iPhone Review",
    },
  );
  expect(parseFocusBlockError(challenge)).toEqual({
    code: "focus_challenge_required",
    channelUrl: "https://www.youtube.com/channel/UCgeekerwan",
    channelName: "Geekerwan",
    channelAvatarUrl: "https://img/avatar.jpg",
    videoTitle: "iPhone Review",
    unlockAt: null,
  });

  const pending = new ApiError("Cooling off", 403, "focus_study_pending", "req-2", null, {
    channelUrl: "https://www.youtube.com/channel/UCnew",
    unlockAt: 1_800_000_000_000 + 23 * 3_600_000 + 10_000,
  });
  const parsedPending = parseFocusBlockError(pending);
  expect(parsedPending?.code).toBe("focus_study_pending");
  expect(remainingCoolingOffHours(parsedPending?.unlockAt ?? 0, 1_800_000_000_000)).toBe(24);

  const nonFocus = new ApiError("Channel is not allowed", 403, "error");
  expect(parseFocusBlockError(nonFocus)).toBeNull();
});
