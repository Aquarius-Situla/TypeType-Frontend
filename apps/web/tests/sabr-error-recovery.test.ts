import { expect, test } from "bun:test";
import {
  playerErrorResumePosition,
  resolvePlayerRetryStartTime,
} from "../src/hooks/use-player-error-resume";
import {
  claimAutomaticSabrRecovery,
  resetAutomaticSabrRecovery,
} from "../src/lib/sabr-error-recovery";

test("allows one automatic SABR recovery until reset", () => {
  const recoveryRef = { current: false };

  expect(claimAutomaticSabrRecovery(recoveryRef)).toBe(true);
  expect(claimAutomaticSabrRecovery(recoveryRef)).toBe(false);

  resetAutomaticSabrRecovery(recoveryRef);

  expect(claimAutomaticSabrRecovery(recoveryRef)).toBe(true);
});

test("allows a later recovery after successful playback resets the episode", () => {
  const recoveryRef = { current: false };

  expect(claimAutomaticSabrRecovery(recoveryRef)).toBe(true);
  resetAutomaticSabrRecovery(recoveryRef);
  expect(claimAutomaticSabrRecovery(recoveryRef)).toBe(true);
  expect(claimAutomaticSabrRecovery(recoveryRef)).toBe(false);
});

test("prefers the captured SABR position during player recovery", () => {
  expect(playerErrorResumePosition(0, 1_795_023, 1_892_543)).toBe(1_795_023);
  expect(playerErrorResumePosition(420_000, undefined, 1_892_543)).toBe(420_000);
  expect(playerErrorResumePosition(0, 0, 1_892_543)).toBe(0);
  expect(playerErrorResumePosition(0, undefined, 1_892_543)).toBeNull();
  expect(playerErrorResumePosition(3_000, undefined, 1_892_543)).toBeNull();
  expect(playerErrorResumePosition(1_892_000, undefined, 1_892_543)).toBe(0);
});

test("uses fallback start time only before an error-recovery position is recorded", () => {
  expect(resolvePlayerRetryStartTime(null, 44_180)).toBe(44_180);
  expect(resolvePlayerRetryStartTime(120_000, 44_180)).toBe(120_000);
  expect(resolvePlayerRetryStartTime(0, 44_180)).toBe(0);
});
