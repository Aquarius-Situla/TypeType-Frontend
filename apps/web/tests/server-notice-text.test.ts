import { expect, test } from "bun:test";
import { backNoticeRemaining, serverNoticeText } from "../src/lib/server-notice-text";
import { m } from "../src/paraglide/messages.js";

test("a notice opened after an earlier return stays quiet", () => {
  const now = 100_000;
  const back = backNoticeRemaining(now - 60_000, now) > 0;

  expect(back).toBe(false);
  expect(serverNoticeText("online", null, "page", back)).toBeNull();
});

test("a return that just happened is announced for three seconds", () => {
  expect(backNoticeRemaining(10_000, 10_500)).toBe(2_500);
  expect(backNoticeRemaining(10_000, 13_000)).toBe(0);
  expect(backNoticeRemaining(null, 10_000)).toBe(0);
});

test("only the page announces the return, the player keeps the outage", () => {
  expect(serverNoticeText("online", null, "page", true)).toBe(m.server_notice_back());
  expect(serverNoticeText("online", null, "player", true)).toBeNull();
  expect(serverNoticeText("unreachable", null, "player", false)).toBe(
    m.server_notice_unreachable(),
  );
});
