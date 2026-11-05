import { expect, test } from "bun:test";
import {
  DashTransientErrorGuard,
  dashErrorCode,
  isTransientDashError,
} from "../src/lib/dash-transient-error-guard";

const contentError = { message: "", code: 1, error: { code: 27, message: "not available" } };
const initError = { message: "", code: 1, error: { code: 28, message: "not available" } };
const manifestError = { message: "", code: 1, error: { code: 25, message: "manifest" } };

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("reads the dash.js error code from a vidstack error detail", () => {
  expect(dashErrorCode(contentError)).toBe(27);
  expect(dashErrorCode({ message: "decode", code: 3 })).toBeNull();
  expect(dashErrorCode(undefined)).toBeNull();
});

test("treats segment and range download failures as transient", () => {
  expect(isTransientDashError(contentError)).toBe(true);
  expect(isTransientDashError(initError)).toBe(true);
  expect(isTransientDashError(manifestError)).toBe(false);
  expect(isTransientDashError({ message: "decode", code: 3 })).toBe(false);
});

test("lets dash.js retry a failed range request instead of recreating the player", () => {
  let escalations = 0;
  const guard = new DashTransientErrorGuard(() => escalations++);
  expect(guard.absorb(initError)).toBe(true);
  expect(guard.absorb(contentError)).toBe(true);
  guard.reset();
  expect(escalations).toBe(0);
});

test("never absorbs fatal errors", () => {
  const guard = new DashTransientErrorGuard(() => undefined);
  expect(guard.absorb(manifestError)).toBe(false);
  expect(guard.absorb({ message: "decode", code: 3 })).toBe(false);
});

test("recreates the player when failures repeat without a loaded fragment", () => {
  const guard = new DashTransientErrorGuard(() => undefined);
  expect(guard.absorb(contentError)).toBe(true);
  expect(guard.absorb(contentError)).toBe(true);
  expect(guard.absorb(contentError)).toBe(false);
  expect(guard.absorb(contentError)).toBe(true);
  guard.reset();
});

test("a loaded fragment clears the failure count", () => {
  const guard = new DashTransientErrorGuard(() => undefined);
  expect(guard.absorb(contentError)).toBe(true);
  expect(guard.absorb(contentError)).toBe(true);
  guard.recordProgress();
  expect(guard.absorb(contentError)).toBe(true);
  expect(guard.absorb(contentError)).toBe(true);
  guard.reset();
});

test("recreates the player when no fragment loads after a transient failure", async () => {
  let escalations = 0;
  const guard = new DashTransientErrorGuard(() => escalations++, 20);
  guard.absorb(contentError);
  await wait(40);
  expect(escalations).toBe(1);
});

test("a loaded fragment cancels the stall escalation", async () => {
  let escalations = 0;
  const guard = new DashTransientErrorGuard(() => escalations++, 20);
  guard.absorb(contentError);
  guard.recordProgress();
  await wait(40);
  expect(escalations).toBe(0);
});

test("hands an offline failure to the player so it reloads once the network is back", () => {
  let escalations = 0;
  const guard = new DashTransientErrorGuard(() => escalations++, 20);
  expect(guard.absorb(contentError, true)).toBe(true);
  expect(guard.absorb(contentError, false)).toBe(false);
  expect(guard.absorb(contentError, true)).toBe(true);
  guard.reset();
  expect(escalations).toBe(0);
});
