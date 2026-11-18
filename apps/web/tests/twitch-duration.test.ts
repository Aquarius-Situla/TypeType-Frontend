import { expect, test } from "bun:test";
import { chatDuration } from "../src/lib/twitch-duration";

test("formats chat mode durations in the largest whole unit", () => {
  expect(chatDuration(1440, "en")).toBe("1 day");
  expect(chatDuration(120, "en")).toBe("2 hours");
  expect(chatDuration(10, "en")).toBe("10 minutes");
  expect(chatDuration(90, "en")).toBe("90 minutes");
});
