import { expect, test } from "bun:test";
import { OfflinePlayerRecovery } from "../src/lib/offline-player-recovery";

test("retries the same source once after network recovery", () => {
  const recovery = new OfflinePlayerRecovery();

  expect(recovery.resumeIfOnline(true)).toBe(false);
  recovery.waitForOnline();
  expect(recovery.resumeIfOnline(false)).toBe(false);
  expect(recovery.resumeIfOnline(true)).toBe(true);
  expect(recovery.resumeIfOnline(true)).toBe(false);
});

test("clears a pending retry when the source changes", () => {
  const recovery = new OfflinePlayerRecovery();

  recovery.waitForOnline();
  recovery.reset();

  expect(recovery.resumeIfOnline(true)).toBe(false);
});
