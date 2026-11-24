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
  const blocked = new ApiError(
    "Focus mode restricts videos outside your study group",
    403,
    "focus_channel_blocked",
    "req-1",
    null,
    {
      channelUrl: "https://www.youtube.com/channel/UCgeekerwan",
      channelName: "Geekerwan",
      channelAvatarUrl: "https://img/avatar.jpg",
      videoTitle: "iPhone Review",
    },
  );
  expect(parseFocusBlockError(blocked)).toEqual({
    code: "focus_channel_blocked",
    channelUrl: "https://www.youtube.com/channel/UCgeekerwan",
    channelName: "Geekerwan",
    channelAvatarUrl: "https://img/avatar.jpg",
    videoTitle: "iPhone Review",
    unlockAt: null,
    allowOnceKind: null,
    aiReviewEligible: false,
    aiRejected: false,
    aiRejectionExpiresAt: null,
    allowOnceCooldownMs: null,
    allowOncePendingUnlockAt: null,
  });

  const rewatchRejected = new ApiError(
    "Already watched",
    403,
    "focus_entertainment_rewatch_blocked",
    "req-3",
    null,
    {
      channelUrl: "https://www.youtube.com/channel/UCfun",
      videoTitle: "Funny Clip",
      allowOnceKind: "entertainment_rewatch",
      aiReviewEligible: true,
      aiRejected: true,
      aiRejectionExpiresAt: 1_900_000_000_000,
      allowOnceCooldownMs: 3_600_000,
      allowOncePendingUnlockAt: 1_800_000_999_000,
    },
  );
  expect(parseFocusBlockError(rewatchRejected)).toEqual({
    code: "focus_entertainment_rewatch_blocked",
    channelUrl: "https://www.youtube.com/channel/UCfun",
    channelName: "",
    channelAvatarUrl: "",
    videoTitle: "Funny Clip",
    unlockAt: null,
    allowOnceKind: "entertainment_rewatch",
    aiReviewEligible: true,
    aiRejected: true,
    aiRejectionExpiresAt: 1_900_000_000_000,
    allowOnceCooldownMs: 3_600_000,
    allowOncePendingUnlockAt: 1_800_000_999_000,
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
